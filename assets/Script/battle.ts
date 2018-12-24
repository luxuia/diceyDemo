// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

import './utils/struct'
import Role from './role'
import AI from './ai'
import Util from './utils/util'

import RoleCfg from './config/rolecfg'


enum BattleSide {
    Player,     // 左下
    Enemy       // 右上
}

@ccclass
export default class BattleMain extends cc.Component {
    static instance: BattleMain

    SpellCardModel: IModel = {
        bg1: 'bg1',
        bg2: 'bg1/bg2',
        name: 'bg1/name',
        desc: 'bg1/desc',
        slot: 'bg1/slot',
        slot_desc: 'bg1/slot/desc',
    }

    spell_handlers: ISpellNode[] = []

    player: Role
    enemy: Role

    spell_pos: Array<cc.Vec2> = []

    //这一轮战斗的人
    battle_turn: BattleSide

    static cached_spell_nodes_count: number = 12

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        cc.find('NextTurn', this.node).on('click', this.on_click_next_turn, this)
    }

    on_click_next_turn() {
        this.next_turn()
    }

    get_attacker() {
        return this.battle_turn == BattleSide.Player ? this.player : this.enemy
    }

    get_defender() {
        return this.battle_turn == BattleSide.Player ? this.enemy : this.player
    }

    get_spell_pos(spell: ISpell, index: number) {
        // 假设只有3张牌，切尺寸都是1格
        return this.spell_pos[index].add(this.spell_pos[index + 3]).mul(0.5)
    }

    static dice_slot_img_str = "<img src='dice_slot'/>"
    static replace_desc_func(spell_cfg, match, sub, sub2) {
        if (spell_cfg[sub]) {
            return spell_cfg[sub]
        }
        if (sub == 'total_dice_points') {
            return BattleMain.dice_slot_img_str
        }
        cc.log(sub, spell_cfg)
        return sub
    }

    next_turn() {
        this.battle_turn = this.battle_turn == BattleSide.Player ?  BattleSide.Enemy: BattleSide.Player

        cc.log(`enter ${this.battle_turn.toString()}'s turn`)

        let defender = this.get_defender()
        defender.on_attack_end()
        let role = this.get_attacker()
        role.on_attack_start()

        if (this.battle_turn == BattleSide.Enemy) {
            AI.run_ai(role)
        }
    }

    start() {
        BattleMain.instance = this

        let player = 'Player'
        this.player = new Role(RoleCfg.robot)
        this.player.side = BattleSide.Player
        this.player.parse_role_ui(player, this.node, -100)

        let enemy = 'Enemy'
        this.enemy = new Role(RoleCfg.warrier)
        this.enemy.side = BattleSide.Enemy
        this.enemy.parse_role_ui(enemy, this.node, 100)

        let self = this
        let spell_root = cc.find('SpellRoot', this.node)

        for (let i = 0; i < 6; i++) {
            this.spell_pos.push(cc.find('SpellRoot/node' + (i + 1), this.node).getPosition())
        }
        self.battle_turn = BattleSide.Enemy

        cc.loader.loadRes('prefab/Spell', cc.Prefab, function (err, res) {
            // 预先生成12张卡牌
            for (let i = 0; i < BattleMain.cached_spell_nodes_count; ++i) {
                let node = cc.instantiate<cc.Node>(res)
                node.setParent(spell_root)

                let node_handle = Util.parse_model(node, null, self.SpellCardModel)
                self.spell_handlers.push({ node_handler: node_handle, alive:true, avaliable_count:0})
            }
            self.next_turn()
        })
    }

    update(dt: number) {

    }


    // update (dt) {}
}
