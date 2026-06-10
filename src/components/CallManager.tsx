import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CallManager: React.FC = () => {
  const { 
    incomingCall, 
    outgoingCall, 
    acceptCall, 
    declineCall, 
    cancelCall 
  } = useSocket();
  const navigate = useNavigate();

  // Automatically navigate callee to meeting when they click answer
  const handleAnswer = () => {
    if (!incomingCall) return;
    const { roomId, type } = incomingCall;
    acceptCall();
    navigate(`/meeting/${roomId}?type=${type}`);
  };

  // Automatically navigate caller to meeting when outgoing call is accepted by peer
  useEffect(() => {
    if (outgoingCall && outgoingCall.status === 'accepted') {
      navigate(`/meeting/${outgoingCall.roomId}?type=${outgoingCall.type}&caller=true`);
    }
  }, [outgoingCall, navigate]);

  return (
    <>
      {/* Incoming Call Notification */}
      <AnimatePresence>
        {incomingCall && incomingCall.status === 'ringing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-[200] w-80 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-background shadow-xl">
                    {incomingCall.callerPhoto ? (
                      <img src={incomingCall.callerPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-background animate-pulse">
                    {incomingCall.type === 'video' ? <Video className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">Incoming {incomingCall.type} Call</h3>
                <p className="text-sm text-muted-foreground mb-6">{incomingCall.callerName}</p>
                
                <div className="flex gap-4 w-full">
                  <button
                    onClick={declineCall}
                    className="flex-grow py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Decline
                  </button>
                  <button
                    onClick={handleAnswer}
                    className="flex-grow py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Phone className="w-5 h-5" />
                    Answer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing Call Overlay */}
      <AnimatePresence>
        {outgoingCall && (outgoingCall.status === 'ringing' || outgoingCall.status === 'rejected' || outgoingCall.status === 'timeout') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full text-center">
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/10 shadow-2xl">
                  {outgoingCall.receiverPhoto ? (
                    <img src={outgoingCall.receiverPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-600" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">
                {outgoingCall.status === 'rejected' ? 'Call Declined' : 
                 outgoingCall.status === 'timeout' ? 'No Answer' : 'Calling...'}
              </h2>
              <p className="text-slate-400 text-lg mb-12">
                {outgoingCall.receiverName || 'Healthcare Provider'}
              </p>

              <div className="flex flex-col items-center gap-6">
                {outgoingCall.status === 'ringing' && (
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}

                <button
                  onClick={cancelCall}
                  className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-2xl shadow-rose-500/30 group"
                >
                  <PhoneOff className="w-8 h-8 group-hover:scale-110 transition-transform" />
                </button>
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">End Call</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallManager;
