import Role from './role'
import BattleMain from './battle';

export default class AI {
    static run_ai(role:Role) {
        BattleMain.instance.schedule(AI.SimpleAI, 1)
    }

    static SimpleAI(role:Role) {
        let casted =false
        for (let i=0; i<role.dice_count; ++i) {
            let dice = role.dice_nodes[i]
            if (dice && dice.alive) {
                for (let j=0;j<role.spell_nodes.length;++j) {
                    let spell = role.spell_nodes[j]
                    if (spell.alive && spell.spell_cfg.max_limit >= dice.point) {
                        role.try_use_spell(spell, dice)
                        casted = true
                        break
                    }
                }
            }
            if (casted)
                break
        }
        if (!casted) {
            BattleMain.instance.unschedule(AI.SimpleAI)
        }
    }
}