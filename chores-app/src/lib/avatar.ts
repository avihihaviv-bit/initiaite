export type Gender = 'male' | 'female'

const CHILD_AGE_CUTOFF = 18

const EMOJI_BY_GENDER_AND_STAGE: Record<Gender, { child: string; adult: string }> = {
  male: { child: '👦', adult: '👨' },
  female: { child: '👧', adult: '👩' },
}

/** Age-and-gender-appropriate default avatar — a child emoji under 18, an adult one otherwise. */
export function suggestAvatarEmoji(gender: Gender, age?: number): string {
  const stage = age != null && age < CHILD_AGE_CUTOFF ? 'child' : 'adult'
  return EMOJI_BY_GENDER_AND_STAGE[gender][stage]
}
