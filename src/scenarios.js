export const yamlString = `
tutorial:
  grid_size: [5, 5]
  available_plants:
    - bean
    - potato
  win_conditions:
    - plants: 10
      time: 20
drought:
  grid_size: [10, 5]
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
        - ["water", 0]
        - ["sun", 20]
storm:
  grid_size: [6, 6]
  available_plants:
    - bean
    - corn
    - onion
  win_conditions:
    - plants: 15
      time: 20
  special_events:
    - description: "Storm"
      day: 10
      effects:
        - ["water", 3]
        - ["sun", 5]
`;