"use client";

import { useCallback, useContext } from "react";
import { soundEngine, type SoundEvent } from "@/lib/sound-system";
import { SoundContext } from "@/components/providers/SoundProvider";

export function useSound() {
  const ctx = useContext(SoundContext);

  const play = useCallback(
    (event: SoundEvent) => {
      if (ctx?.muted) return;
      soundEngine.play(event);
    },
    [ctx?.muted]
  );

  const isMuted = ctx?.muted ?? false;
  const toggleMute = useCallback(() => {
    ctx?.setMuted(!ctx.muted);
  }, [ctx]);

  return { play, isMuted, toggleMute };
}

export function useInteractionSound() {
  const { play } = useSound();

  return {
    onClick: useCallback(() => play("click"), [play]),
    onHover: useCallback(() => play("hover"), [play]),
    onFocus: useCallback(() => play("select"), [play]),
    onSuccess: useCallback(() => play("success"), [play]),
    onError: useCallback(() => play("error"), [play]),
    onToggle: useCallback(
      (isOn: boolean) => play(isOn ? "toggle-on" : "toggle-off"),
      [play]
    ),
    play,
  };
}

export function useNavigationSound() {
  const { play } = useSound();

  return {
    onStart: useCallback(() => play("navigate-start"), [play]),
    onEnd: useCallback(() => play("navigate-end"), [play]),
    onCancel: useCallback(() => play("navigate-cancel"), [play]),
  };
}
