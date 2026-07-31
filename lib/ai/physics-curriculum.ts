export const PHYSICS_CURRICULUM: Record<string, { topics: string[] }> = {
  "IGCSE": {
    topics: [
      "Measurements and Units",
      "Motion",
      "Forces and Newton's Laws",
      "Momentum",
      "Energy Work and Power",
      "Pressure",
      "Thermal Physics",
      "Waves",
      "Light and Optics",
      "Sound",
      "Electricity",
      "Magnetism and Electromagnetism",
      "Radioactivity and Nuclear Physics"
    ]
  },
  "A-Level": {
    topics: [
      "Physical Quantities and Units",
      "Kinematics",
      "Dynamics",
      "Forces Density and Pressure",
      "Work Energy and Power",
      "Deformation of Solids",
      "Waves",
      "Superposition",
      "Electricity",
      "DC Circuits",
      "Particle Physics",
      "Gravitational Fields",
      "Temperature and Ideal Gases",
      "Thermodynamics",
      "Oscillations",
      "Electric Fields",
      "Capacitance",
      "Magnetic Fields",
      "Electromagnetic Induction",
      "Quantum Physics",
      "Nuclear Physics"
    ]
  },
  "Edexcel": {
    topics: [
      "Mechanics and Materials",
      "Waves and Particle Nature of Light",
      "Electric Circuits",
      "Further Mechanics",
      "Electric and Magnetic Fields",
      "Nuclear and Particle Physics",
      "Thermodynamics",
      "Space",
      "Nuclear Radiation",
      "Gravitational Fields",
      "Oscillations"
    ]
  }
}

export const DIFFICULTY_LEVELS = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'standard', label: 'Standard' },
  { id: 'challenging', label: 'Challenging' },
]

export function getCurriculumTopics(levelName: string): string[] {
  const match = Object.keys(PHYSICS_CURRICULUM).find((k) => k.toLowerCase() === levelName.toLowerCase())
  if (match) return PHYSICS_CURRICULUM[match].topics
  return PHYSICS_CURRICULUM['A-Level'].topics
}
