function Warrior(Base) {
    return class extends Base {
        first = 0;
        second = 0;
        third = 0;
        #fourth = 0;
        #say = 'Attaaack';
        constructor(...args) {
            const { say, ...argsToPass } = args[0];
            super(argsToPass);
            this.#say = say;
        }
        attack() {
            this.first++;
            this.second++;
            this.third++;
            this.#fourth++;
            console.log(this.#say);
            console.log([this.first, this.second, this.third, this.#fourth]);
        }
    };
}
class Player {
    name;
    constructor(...args) {
        this.name = args[0].name;
    }
    introduce() {
        console.log(this.name);
    }
}
export const WarriorPlayerType = Warrior(Player);
const warrior = new WarriorPlayerType('', "Conan");
warrior.attack(); // 'attacking...'
warrior.introduce();
function Wings(Base) {
    return class extends Base {
        first = 0;
        second = 0;
        third = 0;
        #fourth = 0;
        fly() {
            this.first++;
            this.second++;
            this.third++;
            this.#fourth++;
            console.log("flying...");
            console.log([this.first, this.second, this.third, this.#fourth]);
        }
    };
}
const WingsWarriorPlayerType = Wings(WarriorPlayerType);
const flyingWarrior = new WingsWarriorPlayerType("Flying Conan");
flyingWarrior.attack();
flyingWarrior.attack();
flyingWarrior.fly();
