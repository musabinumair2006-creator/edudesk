// PhysicsDesk Curriculum Topic Hierarchies

export const CURRICULUM: Record<string, string[]> = {
  "IGCSE": [
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
  ],
  "A-Level": [
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
  ],
  "Edexcel": [
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

export function getTopicsForCurriculum(levelName?: string): string[] {
  if (!levelName) return CURRICULUM["A-Level"]
  
  const normalized = levelName.toLowerCase()
  if (normalized.includes('igcse') || normalized.includes('0625') || normalized.includes('o-level')) {
    return CURRICULUM["IGCSE"]
  }
  if (normalized.includes('edexcel')) {
    return CURRICULUM["Edexcel"]
  }
  return CURRICULUM["A-Level"]
}
