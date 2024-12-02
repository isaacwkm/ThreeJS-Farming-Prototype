export const yamlString = `
tutorial:
  grid_size: [5, 10]
  available_plants:
    - corn
    - bean
  win_conditions:
    - plants: 10
      time: 20
drought:
  grid_size: [6, 6]
  available_plants:
    - corn
    - potato
  win_conditions:
    - plants: 20
      time: 30
  special_events:
    - description: "Drought"
      day: 10
      effects:
        - type: "water"
          change: 0
        - type: "sun"
          change: 20
`;