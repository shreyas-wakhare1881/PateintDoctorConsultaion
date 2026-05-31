'use client';

/**
 * DoctorAvatar — reusable gender-aware professional healthcare avatar
 *
 * Rendering priority:
 *   1. Real profile photo  (profileImageUrl)
 *   2. DiceBear avataaars  (deterministic, seed = doctor ID)
 *   3. Initials fallback   (if DiceBear throws at runtime)
 *
 * Gender-awareness:
 *   - 'Female'  → long-hair hairstyle pool, no facial hair
 *   - 'Male'    → short-hair hairstyle pool, optional beard
 *   - null/undefined/Other → full pool, deterministic selection via seed
 */

import { useMemo } from 'react';
import Image from 'next/image';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DoctorGender =
  | 'Male'
  | 'Female'
  | 'Other'
  | 'PreferNotToSay'
  | null
  | undefined;

export interface DoctorAvatarProps {
  /** Doctor's unique ID — used as DiceBear seed for deterministic output */
  seed: string;
  /** Optional gender for gender-aware hairstyle/facial-hair selection */
  gender?: DoctorGender;
  /** Full name — used for alt text and the initials fallback */
  name?: string;
  /** When present, renders this URL instead of generating an avatar */
  profileImageUrl?: string | null;
  /** Diameter in px. Default: 80 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ── Hairstyle pools ────────────────────────────────────────────────────────────

// camelCase values as defined in @dicebear/avataaars Options type
type TopValue =
  | 'bob' | 'bun' | 'curly' | 'curvy' | 'dreads' | 'frida' | 'fro'
  | 'froBand' | 'longButNotTooLong' | 'miaWallace' | 'shavedSides'
  | 'straight02' | 'straight01' | 'straightAndStrand' | 'bigHair'
  | 'dreads01' | 'dreads02' | 'frizzle' | 'shaggy' | 'shaggyMullet'
  | 'shortCurly' | 'shortFlat' | 'shortRound' | 'shortWaved' | 'sides'
  | 'theCaesar' | 'theCaesarAndSidePart';

const MALE_TOPS: TopValue[] = [
  'shortCurly', 'shortFlat', 'shortRound', 'shortWaved',
  'sides', 'theCaesar', 'theCaesarAndSidePart', 'dreads01', 'dreads02',
];

const FEMALE_TOPS: TopValue[] = [
  'bun', 'curly', 'curvy', 'bob', 'froBand',
  'longButNotTooLong', 'miaWallace', 'straight01', 'straight02',
  'straightAndStrand', 'bigHair',
];

const ALL_TOPS: TopValue[] = [...MALE_TOPS, ...FEMALE_TOPS];

// ── Clothing / skin pools ──────────────────────────────────────────────────────

type ClothingValue = 'blazerAndShirt' | 'blazerAndSweater' | 'collarAndSweater';
const PROF_CLOTHING: ClothingValue[] = [
  'blazerAndShirt',
  'blazerAndSweater',
  'collarAndSweater',
];

// Hex color strings without '#' — used for clothesColor
const CLOTHE_COLORS = [
  '304F6D', // Navy (brand)
  '4B5563', // Slate
  '065F46', // Dark green
  '7C3AED', // Purple
  '0F766E', // Teal
  '1D4ED8', // Blue
];

const SKIN_COLORS = [
  'ffd200', 'f8d25c', 'fdcfa4', 'fd9841',
  'd08b5b', 'ae5d29', 'edb98a',
];

// ── Helper: derive initials ───────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DoctorAvatar({
  seed,
  gender,
  name,
  profileImageUrl,
  size = 80,
  className,
  style,
}: DoctorAvatarProps) {
  // If real photo provided — use it, skip DiceBear
  if (profileImageUrl) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
          ...style,
        }}
      >
        <Image
          src={profileImageUrl}
          alt={name ? `${name} profile photo` : 'Doctor photo'}
          fill
          className="object-cover"
          sizes={`${size}px`}
          unoptimized
        />
      </div>
    );
  }

  return (
    <DiceBearAvatar
      seed={seed}
      gender={gender}
      name={name}
      size={size}
      className={className}
      style={style}
    />
  );
}

// Separated so useMemo rules are never broken by early returns above
function DiceBearAvatar({
  seed,
  gender,
  name,
  size,
  className,
  style,
}: Omit<DoctorAvatarProps, 'profileImageUrl'> & { size: number }) {
  const avatarDataUri = useMemo<string | null>(() => {
    try {
      const isFemale = gender === 'Female';
      const isMale = gender === 'Male';
      const topPool: TopValue[] = isFemale ? FEMALE_TOPS : isMale ? MALE_TOPS : ALL_TOPS;

      const avatar = createAvatar(avataaars, {
        seed,
        top: topPool,
        clothing: PROF_CLOTHING,
        clothesColor: CLOTHE_COLORS,
        skinColor: SKIN_COLORS,
        // No facial hair for female; optional subtle beard for male/unknown
        facialHair: isFemale
          ? []
          : ['beardLight', 'beardMedium'],
        facialHairProbability: isFemale ? 0 : 30,
        // Minimal accessories — glasses only, low probability
        accessories: ['prescription01', 'prescription02'],
        accessoriesProbability: 20,
        eyes: ['default', 'happy', 'wink'],
        eyebrows: ['default', 'defaultNatural', 'raisedExcitedNatural'],
        mouth: ['default', 'smile', 'twinkle'],
        // Transparent background — parent element sets the bg
        backgroundColor: [],
      });

      return avatar.toDataUri();
    } catch {
      return null;
    }
  }, [seed, gender]);

  const sharedStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover',
    ...style,
  };

  // DiceBear succeeded → render as <img>
  if (avatarDataUri) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarDataUri}
        alt={name ? `${name} avatar` : 'Doctor avatar'}
        width={size}
        height={size}
        className={className}
        style={sharedStyle}
      />
    );
  }

  // Initials fallback (DiceBear threw or returned null)
  return (
    <div
      className={className}
      style={{
        ...sharedStyle,
        background: '#304F6D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: Math.max(12, Math.round(size * 0.3)),
      }}
      aria-label={name ? `${name} avatar` : 'Doctor avatar'}
    >
      {name ? getInitials(name) : '?'}
    </div>
  );
}
