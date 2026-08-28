import { ImageResponse } from 'next/og';

export const alt = 'Aimily Context Review: from agent signal to governed collection truth';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const flow = ['Agent signal', 'Context Graph diff', 'Human hash approval', 'Verified receipt + undo'];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F3F2F0',
          color: '#101716',
          padding: '54px 58px 48px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#101716',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              ai
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.04em' }}>aimily</span>
              <span style={{ marginTop: 2, fontSize: 12, color: 'rgba(16,23,22,0.48)' }}>OpenAI WebMCP Challenge</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 999,
              background: '#E7EDC5',
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Live governed sandbox
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 32 }}>
          <div style={{ width: 728, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                borderRadius: 999,
                background: '#FFF6DC',
                padding: '9px 15px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Aimily Context Review
            </div>
            <div style={{ marginTop: 18, fontSize: 55, lineHeight: 0.98, fontWeight: 700, letterSpacing: '-0.055em' }}>
              From agent signal to governed collection truth.
            </div>
            <div style={{ marginTop: 20, width: 680, fontSize: 19, lineHeight: 1.45, color: 'rgba(16,23,22,0.58)' }}>
              A meeting, fitting image or voice note becomes an exact diff with evidence, human approval, receipt and undo.
            </div>
          </div>

          <div
            style={{
              width: 324,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 24,
              background: '#101716',
              color: '#FFFFFF',
              padding: '28px 28px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Context Graph
              </span>
              <span style={{ fontSize: 12, color: '#DDE6B3' }}>7 checks verified</span>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {flow.map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 13,
                    background: index === flow.length - 1 ? '#E7EDC5' : 'rgba(255,255,255,0.06)',
                    color: index === flow.length - 1 ? '#101716' : '#FFFFFF',
                    padding: '11px 13px',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      background: index === flow.length - 1 ? '#101716' : 'rgba(255,255,255,0.12)',
                      color: '#FFFFFF',
                      fontSize: 10,
                    }}
                  >
                    0{index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
              WebMCP is the doorway. Human authority remains visible.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'rgba(16,23,22,0.42)' }}>aimily-webmcp-challenge.vercel.app</span>
          <span style={{ fontWeight: 700 }}>document.modelContext · dynamic intent tools · no DOM reading</span>
        </div>
      </div>
    ),
    size,
  );
}
