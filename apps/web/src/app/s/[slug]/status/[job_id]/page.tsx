"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { playSound } from "@/lib/audio";
import { AmbientBackground } from "@/components/ui";

type JobStatus = 'pending' | 'approved' | 'printing' | 'done' | 'rejected';

export default function JobStatusPage({ params }: { params: { slug: string, job_id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>('pending');
  const [token, setToken] = useState<string>('');
  const [shopId, setShopId] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  
  // Queue stats
  const [peopleAhead, setPeopleAhead] = useState<number>(0);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('status, word_token, shop_id, created_at')
        .eq('id', params.job_id)
        .single();
      
      if (data) {
        setStatus(data.status as JobStatus);
        setToken(data.word_token);
        setShopId(data.shop_id);
        setCreatedAt(data.created_at);
      }
    };
    
    fetchStatus();

    const channel = supabase
      .channel(`job_${params.job_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${params.job_id}`
        },
        (payload) => {
          const newStatus = payload.new.status as JobStatus;
          setStatus(prev => {
            if (prev !== newStatus) {
              if (newStatus === 'approved' || newStatus === 'done') playSound('success');
              else if (newStatus === 'rejected') playSound('error');
              else if (newStatus === 'printing') playSound('notification');
            }
            return newStatus;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.job_id, supabase]);

  // Poll for queue position
  useEffect(() => {
    if (!shopId || !createdAt || status === 'done' || status === 'rejected') return;

    const fetchQueuePosition = async () => {
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .in('status', ['pending', 'approved', 'printing'])
        .lt('created_at', createdAt);
        
      setPeopleAhead(count || 0);
    };

    fetchQueuePosition();
    const interval = setInterval(fetchQueuePosition, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [shopId, createdAt, status, supabase]);

  const estWaitTime = peopleAhead * 3; // 3 mins per person

  const getStatusDisplay = () => {
    switch(status) {
      case 'pending': return { icon: 'bx-time', color: 'text-amber-400', bg: 'bg-amber-400/15', ring: 'ring-amber-400/30', glow: 'shadow-glow-warning', text: 'Waiting for Shopkeeper' };
      case 'approved': return { icon: 'bx-check-double', color: 'text-sky-400', bg: 'bg-sky-400/15', ring: 'ring-sky-400/30', glow: 'shadow-glow-primary', text: 'Approved! Getting Ready' };
      case 'printing': return { icon: 'bx-printer', color: 'text-indigo-400', bg: 'bg-indigo-400/15', ring: 'ring-indigo-400/30', glow: 'shadow-glow-primary', text: 'Printing Now...' };
      case 'done': return { icon: 'bx-check-shield', color: 'text-emerald-400', bg: 'bg-emerald-400/15', ring: 'ring-emerald-400/30', glow: 'shadow-glow-success', text: 'Completed! Please Collect' };
      case 'rejected': return { icon: 'bx-x-circle', color: 'text-red-400', bg: 'bg-red-400/15', ring: 'ring-red-400/30', glow: 'shadow-glow-danger', text: 'Rejected by Shopkeeper' };
      default: return { icon: 'bx-loader-alt', color: 'text-muted-foreground', bg: 'bg-foreground/10', ring: 'ring-foreground/20', glow: '', text: 'Loading...' };
    }
  };

  const display = getStatusDisplay();

  const steps = [
    { id: 'pending', label: 'In Queue', icon: 'bx-list-ol' },
    { id: 'printing', label: 'Printing', icon: 'bx-printer' },
    { id: 'done', label: 'Ready', icon: 'bx-check-shield' }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'done') return 2;
    if (status === 'printing' || status === 'approved') return 1;
    return 0; // pending
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="dark relative min-h-screen p-4 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#0b141a' }}>
      <AmbientBackground />
      <Reveal className="relative z-10 w-full max-w-md glass-strong elev-4 rounded-clay p-8">
        <button
          onClick={() => router.push(`/s/${params.slug}`)}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full glass-faint text-white/70 hover:text-white transition-colors hover:scale-105 active:scale-95"
          aria-label="Back to Upload"
        >
          <i className="bx bx-arrow-back"></i>
        </button>

        <div className="text-center mb-8">
            <p className="text-caption font-semibold uppercase tracking-[0.2em] mb-3 mt-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Token Number</p>
            <div className={`relative inline-flex items-center justify-center px-8 py-4 rounded-clay clay-accent ${display.glow} animate-glow-pulse`}>
                <span className="font-mono font-black text-5xl text-white tracking-tight">#{token || "..."}</span>
            </div>
        </div>

        {/* Visual Tracker */}
        {status !== 'rejected' && (
          <div className="mb-10 relative">
            <div className="absolute top-5 left-5 right-5 z-0">
               <div className="w-full h-1 -translate-y-1/2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div 
                     className="h-full rounded-full transition-all duration-700 shadow-glow-primary"
                     style={{ width: `${(currentStep / 2) * 100}%`, background: 'var(--ps-primary)' }}
                  ></div>
               </div>
            </div>

            <div className="flex justify-between relative z-10">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500
                      ${isActive ? 'text-white clay-accent shadow-glow-primary' : 'glass-faint text-white/40'}
                      ${isCurrent ? 'ring-4 ring-primary/25 animate-glow-pulse' : ''}
                    `}>
                      <i className={`bx ${step.icon}`}></i>
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Queue Stats Box */}
        {(status === 'pending' || status === 'approved') && (
          <div className="glass elev-2 rounded-clay p-5 mb-8 flex">
            <div className="flex-1 text-center pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>People Ahead</p>
              <p className="text-3xl font-black text-gradient">{peopleAhead}</p>
            </div>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
            <div className="flex-1 text-center pl-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Est. Wait</p>
              <p className="text-3xl font-black text-gradient">~{estWaitTime}<span className="text-sm font-semibold ml-1 text-white/50">min</span></p>
            </div>
          </div>
        )}

        {/* Main Status Display */}
        <div className="text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 transition-all duration-500 ring-1 ${display.bg} ${display.color} ${display.ring} ${display.glow}`}>
                <i className={`bx ${display.icon} text-4xl ${status === 'pending' ? 'animate-pulse' : ''} ${status === 'printing' ? 'animate-bounce' : ''}`}></i>
            </div>

            <h2 className="text-h2 font-bold text-white mb-2">
                {display.text}
            </h2>

            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {status === 'pending' && "Your file has been sent to the shop's computer. Please wait for them to print it."}
                {status === 'done' && "Your print is ready. Please show your token at the counter to collect it."}
                {status === 'rejected' && "Please go to the counter, there was an issue with your file."}
            </p>
        </div>

        {/* Done Actions */}
        {status === 'done' && (
          <div className="mt-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-lg font-bold text-center text-emerald-400 mb-4">Thank you for using Print Sathi! 🎉</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push(`/s/${params.slug}`)} className="w-full py-3 clay-accent text-white font-bold rounded-clay shadow-glow-success transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2">
                <i className="bx bx-refresh text-xl"></i> Start Over
              </button>
              <div className="flex gap-3">
                <button onClick={() => router.push(`/s/${params.slug}`)} className="flex-1 py-3 glass text-white font-semibold rounded-clay transition-all hover:brightness-125 active:scale-95 flex items-center justify-center gap-2">
                  <i className="bx bx-message-dots"></i> Continue Chat
                </button>
                <button onClick={() => alert('Support team has been notified. We will reach out shortly.')} className="flex-1 py-3 text-red-400 font-semibold rounded-clay transition-all hover:bg-red-500/10 active:scale-95 flex items-center justify-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <i className="bx bx-error-circle"></i> Report Issue
                </button>
              </div>
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}
