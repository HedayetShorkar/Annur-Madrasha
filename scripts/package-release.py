#!/usr/bin/env python3
"""Import the verified starting package, then maintain the complete website ZIP."""
from __future__ import annotations

import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import zipfile

ARCHIVE = "AnNoor_Payments.zip"
PREFIX = "AnNoor_Payments"
IMPORT_DIR = Path(".github/annoor-import")
MAX_ARCHIVE_BYTES = 16 * 1024 * 1024
MAX_EXPANDED_BYTES = 64 * 1024 * 1024


def excluded(path: PurePosixPath) -> bool:
    if any(p in {".git", "node_modules", "__pycache__", ".cache", ".vite", ".temp"} for p in path.parts):
        return True
    if path.name.startswith(".env") and path.name != ".env.example":
        return True
    if path.name.endswith((".log", ".db", ".db-wal", ".db-shm", ".sqlite", ".sqlite-wal", ".sqlite-shm", ".pyc")):
        return True
    if path.name in {".DS_Store", "Thumbs.db", ARCHIVE, ".AnNoor_Payments.zip.tmp"}:
        return True
    if path.parts[:2] in {("live-class", "data"), ("live-class", "backups"), (".github", "annoor-import")}:
        return True
    return path.suffix == ".zip" and path.parts[0] != "checkpoints"


def verified_import(root: Path) -> tuple[bytes, dict[str, bytes]]:
    seed = root / IMPORT_DIR
    manifest = json.loads((seed / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("format") != 1 or not 0 < manifest["archive_bytes"] <= MAX_ARCHIVE_BYTES:
        raise ValueError("Unsupported or oversized import")
    parts = manifest["parts"]
    if not 1 <= len(parts) <= 256 or len({p["name"] for p in parts}) != len(parts):
        raise ValueError("Invalid import parts")
    encoded = []
    for i, part in enumerate(parts):
        if part["name"] != f"part-{i:04d}.b64":
            raise ValueError("Unexpected import part name")
        data = (seed / part["name"]).read_bytes()
        if len(data) > 100_000 or hashlib.sha256(data).hexdigest() != part["sha256"]:
            raise ValueError("Import part checksum mismatch")
        encoded.append(data)
    archive = base64.b64decode(b"".join(encoded), validate=True)
    if len(archive) != manifest["archive_bytes"] or hashlib.sha256(archive).hexdigest() != manifest["archive_sha256"]:
        raise ValueError("Archive checksum mismatch")
    members: dict[str, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        if sum(i.file_size for i in z.infolist()) > MAX_EXPANDED_BYTES:
            raise ValueError("Expanded import is too large")
        for info in z.infolist():
            path = PurePosixPath(info.filename)
            if path.is_absolute() or ".." in path.parts or "\\" in info.filename or path.parts[0] != PREFIX:
                raise ValueError("Unsafe archive path")
            if stat.S_ISLNK(info.external_attr >> 16):
                raise ValueError("Archive symlinks are not allowed")
            if info.is_dir():
                continue
            relative = PurePosixPath(*path.parts[1:])
            if not relative.parts or relative.parts[0] in {".git", ".github", "scripts", "AGENTS.md", ".gitignore"} or excluded(relative):
                raise ValueError("Protected or private archive path")
            name = relative.as_posix()
            if name in members:
                raise ValueError("Duplicate archive member")
            data = z.read(info)
            if hashlib.sha256(data).hexdigest() != manifest["members_sha256"].get(name):
                raise ValueError("Archive member checksum mismatch")
            target = root / name
            if target.is_symlink() or any(p.is_symlink() for p in target.parents if p != root.parent):
                raise ValueError("Import target is a symlink")
            if target.exists() and (not target.is_file() or target.read_bytes() != data):
                raise ValueError(f"Existing file differs: {name}")
            members[name] = data
    if set(members) != set(manifest["members_sha256"]):
        raise ValueError("Import member list mismatch")
    return archive, members


def import_package(root: Path) -> None:
    archive, members = verified_import(root)
    for name, data in members.items():
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    (root / ARCHIVE).write_bytes(archive)
    shutil.rmtree(root / IMPORT_DIR)
    print(f"Imported {len(members)} verified website files; original ZIP preserved byte for byte.")


def package_release(root: Path) -> None:
    tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"]).decode("utf-8").split("\0")
    names = sorted(n for n in tracked if n and not excluded(PurePosixPath(n)))
    required = {"index.html", "live/index.html", "payments/index.html", "README.md"}
    if not required.issubset(names):
        raise ValueError("The website source is incomplete")
    temporary = root / ".AnNoor_Payments.zip.tmp"
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
            for name in names:
                path = root / name
                if path.is_symlink() or not path.is_file():
                    raise ValueError(f"Unsupported package entry: {name}")
                info = zipfile.ZipInfo(f"{PREFIX}/{name}", date_time=(2026, 10, 23, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = (stat.S_IFREG | 0o644) << 16
                z.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=7)
        with zipfile.ZipFile(temporary) as z:
            if z.testzip() is not None:
                raise ValueError("Generated ZIP failed verification")
        temporary.replace(root / ARCHIVE)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Packaged {len(names)} tracked project files.")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    if (root / IMPORT_DIR / "manifest.json").exists():
        import_package(root)
    else:
        package_release(root)


if __name__ == "__main__":
    main()
