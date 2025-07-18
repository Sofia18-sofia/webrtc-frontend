import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("https://your-render-backend.onrender.com"); // ✅ Use your live backend URL

window.socket = socket;

const VideoRoom = ({ roomId }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStream.current = stream;

        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }

        pc.current = new RTCPeerConnection();

        stream.getTracks().forEach((track) => {
          pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = event.streams[0];
          }
        };

        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              targetId: remoteSocketId,
              signal: { candidate: event.candidate },
            });
          }
        };

        socket.emit('join', roomId, () => {});
      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    };

    let remoteSocketId = null;

    socket.on('ready', async (id) => {
      remoteSocketId = id;
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.emit('signal', {
        targetId: id,
        signal: { sdp: offer },
      });
    });

    socket.on('signal', async ({ callerId, signal }) => {
      remoteSocketId = callerId;

      if (signal.sdp) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          socket.emit('signal', {
            targetId: callerId,
            signal: { sdp: answer },
          });
        }
      }

      if (signal.candidate) {
        await pc.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    socket.on('user-left', () => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
    });

    init();

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((t) => t.stop());
      }
      if (pc.current) {
        pc.current.close();
      }
    };
  }, [roomId]);

  const toggleMic = () => {
    const audioTrack = localStream.current?.getAudioTracks()?.[0];
    if (audioTrack) {
      audioTrack.enabled = !micOn;
      setMicOn((prev) => !prev);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStream.current?.getVideoTracks()?.[0];
    if (videoTrack) {
      videoTrack.enabled = !camOn;
      setCamOn((prev) => !prev);
    }
  };

  return (
    <div className="video-room">
      <div>
        <video ref={localVideo} autoPlay muted playsInline className="video" />
        <video ref={remoteVideo} autoPlay playsInline className="video" />
      </div>
      <div className="controls">
        <button onClick={toggleMic}>{micOn ? 'Mute Mic' : 'Unmute Mic'}</button>
        <button onClick={toggleCam}>{camOn ? 'Turn Off Cam' : 'Turn On Cam'}</button>
      </div>
    </div>
  );
};

export default VideoRoom;
