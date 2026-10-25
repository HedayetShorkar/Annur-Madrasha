import React,{useEffect,useRef,useState} from 'react';
import{LiveKitRoom,VideoConference,GridLayout,ParticipantTile,useTracks}from'@livekit/components-react';
import{Track}from'livekit-client';import'@livekit/components-styles';
import{mountJitsi}from'./jitsi.js';
function VideoWall(){const tracks=useTracks([{source:Track.Source.Camera,withPlaceholder:true},{source:Track.Source.ScreenShare,withPlaceholder:false}]);return <GridLayout tracks={tracks}><ParticipantTile/></GridLayout>;}
function JitsiRoom({info,observeOnly,onDisconnected,onError,onRetry}){
 const host=useRef(null),callbacks=useRef({});callbacks.current={onDisconnected,onError};
 const [state,setState]=useState('loading');
 useEffect(()=>{
  let cancelled=false,meeting;setState('loading');
  mountJitsi(info,{parentNode:host.current,observeOnly,isCancelled:()=>cancelled,onJoined:()=>setState('joined'),onDisconnected:()=>callbacks.current.onDisconnected?.(),onError:()=>{setState('error');callbacks.current.onError?.();}}).then(result=>{meeting=result;if(cancelled)meeting.dispose();else setState(current=>current==='loading'?'ready':current);}).catch(()=>{if(!cancelled){setState('error');callbacks.current.onError?.();}});
  return()=>{cancelled=true;meeting?.dispose();};
 },[info.token,info.domain,info.roomName,observeOnly]);
 return <div className="jitsi-stage">{state==='loading'&&<p className="jitsi-status" role="status">Jitsi ক্লাসরুম খুলছে…</p>}{state==='error'&&<div className="jitsi-status jitsi-error" role="alert">Jitsi সংযোগ বা ডিভাইসের অনুমতি যাচাই করুন।{onRetry&&<button type="button" onClick={onRetry}>নতুন করে সংযোগ করুন</button>}</div>}<div className="jitsi-embed" ref={host}/></div>;
}
export default function MediaRoom(props){const{info,observeOnly=false,onDisconnected,onError}=props;if(info.provider==='jitsi')return <JitsiRoom {...props} observeOnly={observeOnly}/>;return <LiveKitRoom data-lk-theme="default" serverUrl={info.url} token={info.token} connect audio={false} video={false} onDisconnected={onDisconnected} onError={onError}>{observeOnly?<VideoWall/>:<VideoConference/>}</LiveKitRoom>;}
