import React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface LottieLoadingProps {
  animationData?: any;
  animationPath?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  loop?: boolean;
  autoplay?: boolean;
}

// Default loading animations (fallback if no animation provided)
const defaultAnimations = {
  spinner: {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: "Loading Spinner",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Circle",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 1, k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 60, s: [360] }
          ], ix: 10 },
          p: { a: 0, k: [100, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [40, 40], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse Path 1",
                mn: "ADBE Vector Shape - Ellipse",
                hd: false
              },
              {
                ty: "st",
                c: { a: 0, k: [0.2, 0.6, 1, 1], ix: 3 },
                o: { a: 0, k: 100, ix: 4 },
                w: { a: 0, k: 4, ix: 5 },
                lc: 1,
                lj: 1,
                ml: 4,
                bm: 0,
                d: [
                  { n: "d", nm: "dash", v: { a: 0, k: [0, 0], ix: 1 } },
                  { n: "g", nm: "gap", v: { a: 0, k: [0, 0], ix: 2 } }
                ],
                nm: "Stroke 1",
                mn: "ADBE Vector Graphic - Stroke",
                hd: false
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                sk: { a: 0, k: 0, ix: 4 },
                sa: { a: 0, k: 0, ix: 5 },
                nm: "Transform"
              }
            ],
            nm: "Ellipse 1",
            np: 2,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: "ADBE Vector Group",
            hd: false
          }
        ],
        ip: 0,
        op: 60,
        st: 0,
        bm: 0
      }
    ],
    markers: []
  },
  
  dots: {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: "Loading Dots",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Dot 1",
        sr: 1,
        ks: {
          o: { a: 1, k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 15, s: [100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [0] }
          ], ix: 11 },
          p: { a: 0, k: [50, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse Path 1",
                mn: "ADBE Vector Shape - Ellipse",
                hd: false
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.2, 0.6, 1, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                sk: { a: 0, k: 0, ix: 4 },
                sa: { a: 0, k: 0, ix: 5 },
                nm: "Transform"
              }
            ],
            nm: "Ellipse 1",
            np: 2,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: "ADBE Vector Group",
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Dot 2",
        sr: 1,
        ks: {
          o: { a: 1, k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 15, s: [0] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 45, s: [0] }
          ], ix: 11 },
          p: { a: 0, k: [100, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse Path 1",
                mn: "ADBE Vector Shape - Ellipse",
                hd: false
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.2, 0.6, 1, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                sk: { a: 0, k: 0, ix: 4 },
                sa: { a: 0, k: 0, ix: 5 },
                nm: "Transform"
              }
            ],
            nm: "Ellipse 1",
            np: 2,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: "ADBE Vector Group",
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 15,
        bm: 0
      },
      {
        ddd: 0,
        ind: 3,
        ty: 4,
        nm: "Dot 3",
        sr: 1,
        ks: {
          o: { a: 1, k: [
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [0] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 45, s: [100] },
            { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 60, s: [0] }
          ], ix: 11 },
          p: { a: 0, k: [150, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [20, 20], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse Path 1",
                mn: "ADBE Vector Shape - Ellipse",
                hd: false
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.2, 0.6, 1, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
                nm: "Fill 1",
                mn: "ADBE Vector Graphic - Fill",
                hd: false
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0], ix: 2 },
                a: { a: 0, k: [0, 0], ix: 1 },
                s: { a: 0, k: [100, 100], ix: 3 },
                r: { a: 0, k: 0, ix: 6 },
                o: { a: 0, k: 100, ix: 7 },
                sk: { a: 0, k: 0, ix: 4 },
                sa: { a: 0, k: 0, ix: 5 },
                nm: "Transform"
              }
            ],
            nm: "Ellipse 1",
            np: 2,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: "ADBE Vector Group",
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 30,
        bm: 0
      }
    ],
    markers: []
  }
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const LottieLoading: React.FC<LottieLoadingProps> = ({
  animationData,
  animationPath,
  size = 'md',
  className = '',
  text,
  loop = true,
  autoplay = true
}) => {
  const [animation, setAnimation] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Load animation data
  React.useEffect(() => {
    if (animationData) {
      setAnimation(animationData);
      setLoading(false);
    } else if (animationPath) {
      fetch(animationPath)
        .then(response => response.json())
        .then(data => {
          setAnimation(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading Lottie animation:', error);
          setLoading(false);
        });
    } else {
      // Use default animation
      setAnimation(defaultAnimations.spinner);
      setLoading(false);
    }
  }, [animationData, animationPath]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-blue-600', sizeClasses[size])} />
      </div>
    );
  }

  if (!animation) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-blue-600', sizeClasses[size])} />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Lottie
        animationData={animation}
        loop={loop}
        autoplay={autoplay}
        style={{ width: sizeClasses[size].split(' ')[0], height: sizeClasses[size].split(' ')[1] }}
      />
      {text && (
        <p className={cn(
          'text-gray-600 font-medium mt-2',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          size === 'xl' && 'text-xl'
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export { LottieLoading as default };
export { LottieLoading };
