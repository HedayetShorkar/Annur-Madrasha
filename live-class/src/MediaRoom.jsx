import React from 'react';
import{LiveKitRoom,VideoConference,GridLayout,ParticipantTile,useTracks}from'@livekit/components-react';
import{Track}from'livekit-client';import'@livekit/components-styles';
function VideoWall(){const tracks=useTracks([{source:Track.Source.Camera,withPlaceholder:true},{source:Track.Source.ScreenShare,withPlaceholder:false}]);return <GridLayout tracks={tracks}><ParticipantTile/></GridLayout>;}
export default function MediaRoom({info,observeOnly=false,onDisconnected,onError}){return <LiveKitRoom data-lk-theme="default" serverUrl={info.url} token={info.token} connect audio={false} video={false} onDisconnected={onDisconnected} onError={onError}>{observeOnly?<VideoWall/>:<VideoConference/>}</LiveKitRoom>;}
