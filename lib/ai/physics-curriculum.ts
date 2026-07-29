// Physics Curriculum Data — Syllabus-aligned topic lists per level

export type CurriculumLevelName = 'IGCSE' | 'A-Level' | 'Edexcel'

export interface CurriculumData {
  topics: string[]
  exam_board: string
  description: string
}

export const PHYSICS_CURRICULUM: Record<CurriculumLevelName, CurriculumData> = {
  IGCSE: {
    exam_board: 'Cambridge IGCSE',
    description: 'Cambridge International General Certificate of Secondary Education Physics (0625)',
    topics: [
      'Measurements and Units',
      'Motion',
      "Forces and Newton's Laws",
      'Momentum',
      'Energy, Work and Power',
      'Pressure',
      'Thermal Physics and Temperature',
      'Thermal Properties of Matter',
      'Waves — General Properties',
      'Light and Optics',
      'Sound',
      'Electricity — Current and Voltage',
      'Electrical Components and Circuits',
      'Magnetism',
      'Electromagnetism',
      'Radioactivity and Nuclear Physics',
      'Space Physics',
    ],
  },
  'A-Level': {
    exam_board: 'Cambridge A-Level',
    description: 'Cambridge International A Level Physics (9702)',
    topics: [
      'Physical Quantities and Units',
      'Measurement Techniques and Errors',
      'Kinematics',
      'Dynamics',
      "Forces, Density and Pressure",
      'Work, Energy and Power',
      'Deformation of Solids',
      'Waves — General Properties',
      'Superposition and Interference',
      'Electricity — Current and Resistance',
      'DC Circuits and Kirchhoff\'s Laws',
      'Particle Physics',
      'Gravitational Fields',
      'Temperature and Ideal Gases',
      'First Law of Thermodynamics',
      'Oscillations and Simple Harmonic Motion',
      'Electric Fields',
      'Capacitance',
      'Magnetic Fields',
      'Electromagnetic Induction',
      'Alternating Currents',
      'Quantum Physics and Photoelectric Effect',
      'Nuclear Physics',
      'Medical Physics (AS Extension)',
      'Astronomy and Cosmology (A2 Extension)',
    ],
  },
  Edexcel: {
    exam_board: 'Pearson Edexcel',
    description: 'Pearson Edexcel International Advanced Level Physics (WPH)',
    topics: [
      'Mechanics — Motion and Forces',
      'Materials — Stress, Strain and Properties',
      'Waves and the Particle Nature of Light',
      'Electric Circuits and Components',
      'Further Mechanics — Momentum and Circular Motion',
      'Electric and Magnetic Fields',
      'Nuclear and Particle Physics',
      'Thermodynamics',
      'Space Physics and Astrophysics',
      'Nuclear Radiation and Decay',
      'Gravitational Fields',
      'Oscillations and SHM',
      'Capacitors and Exponential Decay',
      'Electromagnetic Induction and AC',
      'Quantum Mechanics and Wave-Particle Duality',
    ],
  },
}

export const DIFFICULTY_LEVELS = [
  { value: 'foundation', label: 'Foundation', description: 'Basic concepts, recall and recognition' },
  { value: 'standard', label: 'Standard', description: 'Application of concepts, moderate calculations' },
  { value: 'challenging', label: 'Challenging', description: 'Analysis, evaluation, complex multi-step problems' },
] as const

export type DifficultyLevel = 'foundation' | 'standard' | 'challenging'

export const ASSIGNMENT_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'classwork', label: 'Classwork' },
  { value: 'midterm', label: 'Mid-Term Paper' },
  { value: 'finalterm', label: 'Final Term Paper' },
] as const

export function getCurriculumTopics(levelName: string): string[] {
  const key = levelName as CurriculumLevelName
  return PHYSICS_CURRICULUM[key]?.topics ?? []
}

export function getAllCurriculumLevelNames(): CurriculumLevelName[] {
  return Object.keys(PHYSICS_CURRICULUM) as CurriculumLevelName[]
}
