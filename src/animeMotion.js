import { useEffect } from 'react';
import { animate, createTimer, stagger } from 'animejs';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const managedAnimations = new WeakMap();

function prefersReducedMotion() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches || false;
}

function stopAnimation(target) {
  const animation = managedAnimations.get(target);
  if (animation) {
    animation.cancel();
    managedAnimations.delete(target);
  }
}

function runManagedAnimation(target, params) {
  if (!target) return null;
  stopAnimation(target);
  const animation = animate(target, {
    ...params,
    duration: prefersReducedMotion() ? 1 : params.duration,
    delay: prefersReducedMotion() ? 0 : params.delay,
  });
  managedAnimations.set(target, animation);
  return animation;
}

function cancelAnimation(animation) {
  if (!animation) return;
  if (typeof animation.cancel === 'function') {
    animation.cancel();
  }
}

function readPixelVar(styles, name) {
  const value = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : 0;
}

function getFoodRotation(item) {
  return getComputedStyle(item).getPropertyValue('--food-rotate').trim() || '0deg';
}

function shouldSkipInteractiveTarget(target) {
  return target.matches('button:disabled, [aria-disabled="true"]');
}

function containsRelatedTarget(target, relatedTarget) {
  return relatedTarget instanceof Node && target.contains(relatedTarget);
}

function animateBrand(target, isActive) {
  const icon = target.querySelector('.brand-icon-wrapper');
  runManagedAnimation(icon, {
    duration: 260,
    ease: 'out(3)',
    rotate: isActive ? '15deg' : '0deg',
    scale: isActive ? 1.05 : 1,
  });
}

function animateControl(target, isActive) {
  let params = {
    duration: 180,
    ease: isActive ? 'out(3)' : 'out(2)',
    scale: isActive ? 1.018 : 1,
    translateY: isActive ? -1 : 0,
  };

  if (target.matches('.map-legend button')) {
    params = {
      duration: 190,
      ease: 'out(3)',
      scale: isActive ? 1.02 : 1,
      translateY: isActive ? -2 : 0,
    };
  } else if (target.matches('.area-overview-list button')) {
    params = {
      duration: 190,
      ease: 'out(3)',
      scale: 1,
      translateX: isActive ? 3 : 0,
    };
  }

  runManagedAnimation(target, params);
}

function animateFoodItem(target, isActive) {
  const content = target.querySelector('.food-float-content');
  const isSelected = target.classList.contains('is-selected');
  runManagedAnimation(content, {
    duration: 220,
    ease: 'out(3)',
    rotate: isActive || isSelected ? '0deg' : getFoodRotation(target),
    scale: isActive || isSelected ? 1.08 : 1,
  });
}

function animateMapRegion(target, isActive) {
  runManagedAnimation(target, {
    duration: 240,
    ease: 'out(3)',
    scale: isActive ? 1.012 : 1,
  });
}

function animateImageCard(target, isActive) {
  runManagedAnimation(target, {
    duration: 280,
    ease: isActive ? 'outBack(1.6)' : 'out(3)',
    rotateX: isActive ? '0deg' : '10deg',
    scale: isActive ? 1.03 : 1,
    translateY: isActive ? -8 : 0,
  });
}

const CONTROL_SELECTOR = [
  '.secondary-action',
  '.mode-switch button',
  '.site-theme-switch button',
  '.stepper button',
  '.mcp-actions button',
  '.asset-actions button',
  '.quiz-option-btn',
  '.game-reward button',
  '.map-legend button',
  '.area-overview-list button',
].join(', ');

const INTERACTIVE_SELECTOR = [
  '.brand',
  '.food-float-item',
  '.province',
  '.map-image-card',
  CONTROL_SELECTOR,
].join(', ');

function animateInteractiveTarget(target, isActive) {
  if (!target || shouldSkipInteractiveTarget(target)) return;
  if (target.matches('.brand')) {
    animateBrand(target, isActive);
  } else if (target.matches('.food-float-item')) {
    animateFoodItem(target, isActive);
  } else if (target.matches('.province')) {
    animateMapRegion(target, isActive);
  } else if (target.matches('.map-image-card')) {
    animateImageCard(target, isActive);
  } else if (target.matches(CONTROL_SELECTOR)) {
    animateControl(target, isActive);
  }
}

export function useAnimeHoverInteractions(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    function findTarget(event) {
      const target = event.target.closest?.(INTERACTIVE_SELECTOR);
      return target && root.contains(target) ? target : null;
    }

    function handlePointerOver(event) {
      const target = findTarget(event);
      if (!target || containsRelatedTarget(target, event.relatedTarget)) return;
      animateInteractiveTarget(target, true);
    }

    function handlePointerOut(event) {
      const target = findTarget(event);
      if (!target || containsRelatedTarget(target, event.relatedTarget)) return;
      animateInteractiveTarget(target, false);
    }

    function handleFocusIn(event) {
      animateInteractiveTarget(findTarget(event), true);
    }

    function handleFocusOut(event) {
      animateInteractiveTarget(findTarget(event), false);
    }

    root.addEventListener('pointerover', handlePointerOver);
    root.addEventListener('pointerout', handlePointerOut);
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', handleFocusOut);

    return () => {
      root.removeEventListener('pointerover', handlePointerOver);
      root.removeEventListener('pointerout', handlePointerOut);
      root.removeEventListener('focusin', handleFocusIn);
      root.removeEventListener('focusout', handleFocusOut);
    };
  }, [rootRef]);
}

export function useAnimeThemeSwap(rootRef, themeKey) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const panels = root.querySelectorAll('.topbar, .map-stage, .side-card');
    const animations = [
      animate(root, {
        duration: prefersReducedMotion() ? 1 : 360,
        ease: 'out(3)',
        opacity: [0.92, 1],
        scale: [0.996, 1],
      }),
      animate(panels, {
        delay: prefersReducedMotion() ? 0 : stagger(35),
        duration: prefersReducedMotion() ? 1 : 420,
        ease: 'out(3)',
        opacity: [0.88, 1],
        translateY: [4, 0],
      }),
    ];

    return () => animations.forEach(cancelAnimation);
  }, [rootRef, themeKey]);
}

export function useAnimeMapStage(stageRef, motionKey, isLoading) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const animations = [];
    const fillImages = [...stage.querySelectorAll('.map-fill-image')];
    fillImages.forEach((image, index) => {
      const finalOpacity = Number.parseFloat(image.dataset.animeOpacity || '1');
      const isHighlighted = image.dataset.animeHighlight === 'true';
      const seen = image.dataset.animeSeen === 'true';
      const currentOpacity = seen ? Number.parseFloat(getComputedStyle(image).opacity || '0') : 0;
      const startOpacity = Number.isFinite(currentOpacity) ? currentOpacity : 0;
      const targetOpacity = Number.isFinite(finalOpacity) ? finalOpacity : 1;
      image.dataset.animeSeen = 'true';
      image.style.opacity = String(startOpacity);
      animations.push(animate(image, {
        delay: prefersReducedMotion() || seen ? 0 : index * 45,
        duration: prefersReducedMotion() ? 1 : (seen ? 220 : image.classList.contains('is-soft') ? 460 : 620),
        ease: 'out(3)',
        opacity: [startOpacity, targetOpacity],
        scale: seen ? (isHighlighted ? 1.018 : 1) : [0.965, isHighlighted ? 1.018 : 1],
      }));
    });

    const loadingText = stage.querySelector('.map-loading');
    if (loadingText) {
      if (prefersReducedMotion()) {
        loadingText.style.opacity = '0.75';
      } else {
        animations.push(animate(loadingText, {
          alternate: true,
          duration: 1000,
          ease: 'inOutSine',
          loop: true,
          opacity: [0.4, 0.9],
        }));
      }
    }

    return () => animations.forEach(cancelAnimation);
  }, [stageRef, motionKey, isLoading]);
}

export function useAnimeFoodLayer(stageRef, motionKey, itemCount, setIsReady) {
  useEffect(() => {
    setIsReady(false);
    const stage = stageRef.current;
    if (!stage) return undefined;

    const layer = stage.querySelector('.food-orbit-layer');
    const contents = layer ? [...layer.querySelectorAll('.food-float-content')] : [];
    if (!contents.length) {
      setIsReady(true);
      return undefined;
    }

    if (prefersReducedMotion()) {
      contents.forEach((content) => {
        const item = content.closest('.food-float-item');
        content.style.opacity = '1';
        content.style.filter = 'blur(0px) saturate(1)';
        content.style.transform = `rotate(${getFoodRotation(item)}) scale(1)`;
      });
      setIsReady(true);
      return undefined;
    }

    let readyAt = 0;
    const animations = contents.map((content, index) => {
      const item = content.closest('.food-float-item');
      const styles = getComputedStyle(item);
      const delay = Math.max(0, readPixelVar(styles, '--food-delay') || index * 72);
      const fromX = readPixelVar(styles, '--from-x');
      const fromY = readPixelVar(styles, '--from-y');
      const toX = readPixelVar(styles, '--to-x');
      const toY = readPixelVar(styles, '--to-y');
      const duration = 780;
      readyAt = Math.max(readyAt, delay + duration);

      content.style.opacity = '0';
      return animate(content, {
        delay,
        duration,
        ease: 'out(4)',
        filter: ['blur(8px) saturate(0.8)', 'blur(0px) saturate(1)'],
        opacity: [0, 1],
        rotate: ['-18deg', getFoodRotation(item)],
        scale: [0.24, 1],
        translateX: [fromX - toX, 0],
        translateY: [fromY - toY, 0],
      });
    });

    const readyTimer = createTimer({
      duration: readyAt,
      onComplete: () => setIsReady(true),
    });

    return () => {
      animations.forEach(cancelAnimation);
      readyTimer.cancel();
    };
  }, [stageRef, motionKey, itemCount, setIsReady]);
}

export function useAnimeFoodSelection(stageRef, motionKey, isReady) {
  useEffect(() => {
    if (!isReady) return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;

    const animations = [...stage.querySelectorAll('.food-float-item')].map((item) => {
      const content = item.querySelector('.food-float-content');
      return runManagedAnimation(content, {
        duration: 260,
        ease: 'out(3)',
        rotate: item.classList.contains('is-selected') ? '0deg' : getFoodRotation(item),
        scale: item.classList.contains('is-selected') ? 1.08 : 1,
      });
    });

    return () => animations.forEach(cancelAnimation);
  }, [stageRef, motionKey, isReady]);
}

export function useAnimePanelMotion(panelRef, motionKey) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    const animations = [];
    const card = panel.querySelector('.food-process-card');
    if (card) {
      animations.push(animate(card, {
        duration: prefersReducedMotion() ? 1 : 460,
        ease: 'out(4)',
        opacity: [0, 1],
        scale: [0.98, 1],
        translateX: [18, 0],
      }));
      animations.push(animate(card.querySelectorAll('.process-sketch-step'), {
        delay: prefersReducedMotion() ? 0 : stagger(70),
        duration: prefersReducedMotion() ? 1 : 500,
        ease: 'out(4)',
        opacity: [0, 1],
        translateY: [10, 0],
      }));
    }

    const reward = panel.querySelector('.game-reward');
    if (reward) {
      animations.push(animate(reward, {
        duration: prefersReducedMotion() ? 1 : 360,
        ease: 'outBack(1.4)',
        opacity: [0, 1],
        scale: [0.96, 1],
      }));
    }

    const answerButtons = panel.querySelectorAll('.quiz-option-btn.is-correct, .quiz-option-btn.is-wrong');
    if (answerButtons.length) {
      animations.push(animate(answerButtons, {
        delay: prefersReducedMotion() ? 0 : stagger(45),
        duration: prefersReducedMotion() ? 1 : 260,
        ease: 'out(3)',
        scale: [1, 1.025, 1],
        translateX: [0, 4, 0],
      }));
    }

    const steamLines = panel.querySelectorAll('.steam-line');
    if (steamLines.length && !prefersReducedMotion()) {
      animations.push(animate(steamLines, {
        alternate: true,
        delay: stagger(280),
        duration: 1200,
        ease: 'inOutSine',
        loop: true,
        opacity: [0.2, 0.8],
        translateY: [2, -3],
      }));
    }

    return () => animations.forEach(cancelAnimation);
  }, [panelRef, motionKey]);
}

export function useAnimeSpinners(rootRef, motionKey) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const animations = [...root.querySelectorAll('.anime-spin')].map((spinner) => animate(spinner, {
      duration: 1000,
      ease: 'linear',
      loop: true,
      rotate: '360deg',
    }));

    return () => animations.forEach(cancelAnimation);
  }, [rootRef, motionKey]);
}
