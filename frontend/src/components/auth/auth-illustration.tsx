'use client';

/**
 * AuthIllustration — decorative SVG used on doctor landing and profile setup.
 * Clean healthcare lifestyle visual, hand-crafted SVG.
 */

interface AuthIllustrationProps {
  type: 'patient' | 'doctor' | 'success' | 'pending';
  className?: string;
}

export function AuthIllustration({ type, className }: AuthIllustrationProps) {
  if (type === 'patient') {
    return (
      <svg viewBox="0 0 220 180" fill="none" className={className} aria-hidden>
        {/* Background circles */}
        <circle cx="110" cy="90" r="80" fill="hsl(174 100% 97%)" />
        <circle cx="110" cy="90" r="60" fill="hsl(174 86% 90%)" />
        {/* Phone/mobile device */}
        <rect x="80" y="48" width="60" height="96" rx="10" fill="white" stroke="hsl(174 62% 37%)" strokeWidth="2.5" />
        <rect x="88" y="64" width="44" height="60" rx="4" fill="hsl(174 100% 97%)" />
        {/* Screen content lines */}
        <rect x="92" y="70" width="30" height="3" rx="1.5" fill="hsl(174 62% 37%)" opacity=".6" />
        <rect x="92" y="78" width="22" height="3" rx="1.5" fill="hsl(215 14% 48%)" opacity=".4" />
        <rect x="92" y="86" width="36" height="3" rx="1.5" fill="hsl(215 14% 48%)" opacity=".4" />
        {/* Pulse / heartbeat line */}
        <path d="M93 100 h4 l3 -8 l4 14 l3 -6 h4" stroke="hsl(174 62% 37%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Home button */}
        <circle cx="110" cy="132" r="5" stroke="hsl(174 62% 37%)" strokeWidth="2" />
        {/* Stars / sparkles */}
        <circle cx="58" cy="62" r="4" fill="hsl(152 60% 38%)" opacity=".7" />
        <circle cx="162" cy="118" r="6" fill="hsl(174 62% 37%)" opacity=".5" />
        <circle cx="155" cy="58" r="3" fill="hsl(152 60% 38%)" opacity=".5" />
      </svg>
    );
  }

  if (type === 'doctor') {
    return (
      <svg viewBox="0 0 280 200" fill="none" className={className} aria-hidden>
        <circle cx="140" cy="100" r="90" fill="hsl(152 76% 96%)" />
        {/* Doctor figure */}
        <circle cx="140" cy="62" r="22" fill="white" stroke="hsl(174 62% 37%)" strokeWidth="2" />
        {/* Coat */}
        <path d="M106 160 Q106 116 140 112 Q174 116 174 160" fill="white" stroke="hsl(174 62% 37%)" strokeWidth="2" />
        {/* Stethoscope */}
        <path d="M128 128 Q120 140 124 152 Q128 162 140 162 Q152 162 156 152 Q160 140 152 128"
          stroke="hsl(174 62% 37%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="140" cy="162" r="5" fill="hsl(174 62% 37%)" />
        {/* Cross badge */}
        <rect x="158" y="80" width="22" height="22" rx="6" fill="hsl(174 62% 37%)" />
        <rect x="167.5" y="84" width="3" height="14" rx="1.5" fill="white" />
        <rect x="161.5" y="89.5" width="15" height="3" rx="1.5" fill="white" />
        {/* Floating badges */}
        <rect x="44" y="70" width="52" height="24" rx="12" fill="hsl(174 62% 37%)" opacity=".12" />
        <text x="70" y="86" textAnchor="middle" fill="hsl(174 62% 30%)" fontSize="9" fontWeight="600">Verified</text>
        <rect x="184" y="148" width="52" height="24" rx="12" fill="hsl(152 60% 38%)" opacity=".12" />
        <text x="210" y="164" textAnchor="middle" fill="hsl(152 60% 22%)" fontSize="9" fontWeight="600">Available</text>
      </svg>
    );
  }

  if (type === 'success') {
    return (
      <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
        <circle cx="60" cy="60" r="54" fill="hsl(152 76% 96%)" />
        <circle cx="60" cy="60" r="42" fill="hsl(152 60% 38%)" opacity=".12" />
        <circle cx="60" cy="60" r="30" fill="hsl(152 60% 38%)" />
        <path d="M44 60 l10 10 l22 -20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'pending') {
    return (
      <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
        <circle cx="60" cy="60" r="54" fill="hsl(41 100% 97%)" />
        <circle cx="60" cy="60" r="42" fill="hsl(38 92% 50%)" opacity=".12" />
        <circle cx="60" cy="60" r="30" fill="hsl(38 92% 50%)" />
        <path d="M60 38 v22 l12 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return null;
}
