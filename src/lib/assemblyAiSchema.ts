/**
 * AssemblyAI Voice Agent Tool Definition
 * Tool Name: report_safety_hazard
 */
export const REPORT_SAFETY_HAZARD_TOOL = {
  type: 'function',
  function: {
    name: 'report_safety_hazard',
    description: 'Triggered when a worker or safety officer verbally reports an industrial safety hazard, equipment anomaly, spill, thermal spike, or machinery failure.',
    parameters: {
      type: 'object',
      properties: {
        hazard_level: {
          type: 'string',
          enum: ['low', 'medium', 'critical'],
          description: 'Severity level of the hazard: "critical" (immediate danger, fire, smoke, structural risk, stop work), "medium" (pressure drop, minor leak, mechanical slip, warning threshold), "low" (minor vibration, scheduled maintenance notice, cosmetic issue).',
        },
        equipment_id: {
          type: 'string',
          description: 'Standardized industrial equipment identifier, unit code, or machinery name (e.g. TURBINE-04, PUMP-P09, CONVEYOR-CV12, GENERATOR-GEN404, BOILER-B02, ROBOT-ARM-1).',
        },
        location: {
          type: 'string',
          description: 'Industrial facility zone, building, sector, bay, or room where the hazard is present (e.g. Sector 9 - Power Hall, Warehouse B - Bay 3, Facility Alpha - Loop A, Chemical Storage North, Assembly Line 4).',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the observed hazard, operational symptoms, environmental risks, and immediate conditions.',
        },
      },
      required: ['hazard_level', 'equipment_id', 'location', 'description'],
    },
  },
} as const;

export const ASSEMBLYAI_AGENT_PROMPT = `
You are the HazVox AI Voice Agent, an industrial safety command dispatch assistant.
Your duty is to continuously monitor worker verbal reports from factory floors, chemical plants, and construction sites.
Whenever a user speaks about an anomaly, malfunction, equipment failure, safety breach, smoke, leak, vibration, or hazard:
Immediately extract the parameters and invoke the tool \`report_safety_hazard\` with:
- hazard_level: "low", "medium", or "critical"
- equipment_id: the machinery or unit code (e.g. "GEN-404", "TURBINE-04", "CONVEYOR-CV12")
- location: the sector, floor, or zone (e.g. "Sector 7", "Warehouse B", "Power Hall")
- description: concise summary of the issue.
`;
