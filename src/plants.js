export const allPlantDefinitions = [
    function bean($) {
        $.name("bean");
        $.icon("🫘");
        $.grow(({ plant, sun, water, neighbors }) => {
            const sameNeighbors = neighbors
                .filter(neighbor => neighbor.type === plant.type);
            const isHappy = sameNeighbors.length >= 2 && sun > 3 && water > 1;
            return isHappy;
        });
    },
    function corn($) {
        $.name("corn");
        $.icon("🌽");
        $.grow(({ sun, water }) => {
            const isHappy = sun > 3 && water < 2;
            return isHappy;
        });
    },
    function potato($) {
        $.name("potato");
        $.icon("🥔");
        $.grow(({ water, neighbors }) => {
            const isHappy = neighbors.length <= 2 && water > 2;
            return isHappy;
        });
    },
    function onion($) {
        $.name("onion");
        $.icon("🧅");
        $.grow(({ plant, water, neighbors }) => {
            const sameNeighbors = neighbors
                .filter(neighbor => neighbor.type === plant.type);
            const isHappy = neighbors.length >= 2
                && sameNeighbors.length < 2 && water > 2;
            return isHappy;
        }) 
    }
]