// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

import * as Role from './config/role'
import { deepCopy } from './utils/math'
import './utils/struct'

enum BattleSide {
    Player,     // 左下
    Enemy       // 右上
}

@ccclass
export default class BattleMain extends cc.Component {

    RoleModel:IModel = {
        name:'Name',
        career:'Career',
        hp_progress:'HP',
        hp_num:'HP/num',
        dice_root:'Dices',
    }

    SpellCardModel:IModel = {
        bg1:'bg1',
        bg2:'bg1/bg2',
        name:'bg1/name',
        desc:'bg1/desc',
        slot:'bg1/slot',
        slot_desc:'bg1/slot/desc',
    }

    spell_handlers: {[key:number]:ISpellNode} = {}

    player:IRole
    enemy:IRole

    spell_pos:Array<cc.Vec2> = []

    //这一轮战斗的人
    battle_turn:string

    cached_spell_nodes_count:number=12

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    random_int(min:number, max:number){
        return Math.floor(Math.random()*(max-min+1))+min
    }

    parse_model(node:cc.Node, parent:string, model:IModel) {
        let handler:IModelNode = {}
        Object.keys(model).forEach(key=>{
            handler[key] = cc.find((parent? parent + '/':'') + model[key], node)
        })
        handler['self'] = parent?cc.find(parent, node):node
        return handler
    }

    show_role_info(role_tag:string, role:IRole, ease_from:number) {

        //let handler:ModelNode = {}
        let idx = 0.1
        let handler = this.parse_model(this.node, role_tag, this.RoleModel)
        Object.keys(this.RoleModel).forEach(key=>{
            let node = handler[key]
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            this.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1
        })

        let dices_model = {}
        for (let i=1;i<5;i++) {
            dices_model['dices' +i] = 'Dices/Dice'+i
        }

        let dice_handler = this.parse_model(this.node, role_tag, dices_model)

        role.dice_nodes = []

        for (let i=1; i<5; ++i) {
            let key = 'dices' + i

            let node = dice_handler[key]

            role.dice_nodes.push({node_handler:{self:node}, dice_info:null})

            node.on(cc.Node.EventType.TOUCH_START, function(event){
                node.opacity = 100
                cc.log('touch begin ', key)
            })
            let self = this
            node.on(cc.Node.EventType.TOUCH_END, function(event:cc.Event.EventTouch){
                node.opacity = 255

                cc.log('touch end ', key)

                for (let key in self.spell_handlers) {
                    let element = self.spell_handlers[key].node_handler
                    let bg_com = element.bg1.getComponent(cc.Sprite)
                    if (element.bg1.getBoundingBoxToWorld().contains(event.getLocation())){
                        cc.log("touch in spell card", key)

                        self.try_use_spell(role, self.spell_handlers[key], role.dice_nodes[i-1])
                        break
                    }
                };
            })
            node.on(cc.Node.EventType.TOUCH_MOVE, function(event:cc.Event.EventTouch){
                let delta = event.getDelta()
                node.x += delta.x
                node.y += delta.y
            })
        }


        handler.hp_num.getComponent(cc.Label).string = `${role.hp}/${role.max_hp}`
        handler.hp_progress.getComponent(cc.ProgressBar).progress = role.hp/role.max_hp
        handler.name.getComponent(cc.Label).string = role.name
        handler.career.getComponent(cc.Label).string = ''

        role.role_nodes = handler
    }

    try_use_spell(role:IRole, spell:ISpellNode, dice:IDiceNode) {
        //check can add this dice
        let cfg = spell.spell_cfg
        // 需要骰子，已有骰子数量小于需要的
        if (cfg.slot_count <= 0 && spell.dices.length >= cfg.slot_count) return 
        // 骰子点数大于最大值
        if (cfg.max_limit && cfg.max_limit < dice.dice_info.point) return
        
        spell.dices.push(dice)
        
        // 把骰子放到卡片对应的槽上
        let slot_pos = spell.node_handler.slot.convertToWorldSpaceAR(cc.Vec2.ZERO)
        let dice_root = role.role_nodes.dice_root
        let node_space_pos = dice_root.convertToNodeSpaceAR(slot_pos)
        let dice_action = cc.moveTo(0.2, node_space_pos)
        dice_action.easing(cc.easeInOut(5))
        let dice_node = dice.node_handler.self
        dice_node.runAction(dice_action)

        if (cfg.slot_count > spell.dices.length) return

        this.scheduleOnce(function(){
            dice_node.stopAction(dice_action)
            let total_point = 0
            for (let i=0; i < spell.dices.length;++i) {
                total_point+=spell.dices[i].dice_info.point
            }
            let damage = cfg.damage_func(total_point)

            let targety:number
            let dice_targety:number
            let card_height = 100 //TODO calc card height
            if (damage > 0) {
                // attack other
                targety = cc.winSize.height/2+card_height
                dice_targety = cc.winSize.height+card_height

            } else {
                // recover me
                targety = -cc.winSize.height/2+card_height
                dice_targety = -cc.winSize.height+card_height
            }

            let old_x = spell.node_handler.self.x
            let action = cc.moveTo(0.5, old_x, targety)
            action.easing(cc.easeInOut(3))
            spell.node_handler.self.runAction(action)

            
            old_x = dice_node.x
            let old_y = dice_node.y
            let dice_local = dice_root.convertToNodeSpaceAR(new cc.Vec2(0, dice_targety))
            cc.log(dice_node, dice_local, targety)
            let node_action = cc.moveTo(0.5, old_x, dice_local.y)
            node_action.easing(cc.easeInOut(3))
            dice_node.runAction(node_action)
        }, 0.2)
    }

    show_dices(role:IRole) {
        let dices = role.dice_nodes
        
        let dice_count = role.dice_count

        let ease_from = role.side == BattleSide.Player?-100:100
        let idx = 0.1
        for (let key=0;key<dice_count; key ++){

            let node = dices[key].node_handler.self
            node.active = true

            let self = this
            cc.loader.loadRes('Texture/dice', cc.SpriteAtlas, function(err, atlas:cc.SpriteAtlas){
                let dice_count = self.random_int(1, 6)
                let frame = atlas.getSpriteFrame('dice' + dice_count)
                node.getComponent(cc.Sprite).spriteFrame = frame

                dices[key].dice_info = {idx:key, point:dice_count}
            })

            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            this.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1
        }

        for (let i=dice_count;i<dices.length;i++) {
            dices[i].node_handler.self.active = false
        }
    }

    show_spell_card(role:IRole) {
        let spells = role.spells
        for (let i=0;i<spells.length;++i) {
            let target_pos = this.get_spell_pos(spells[i], i)
            // 保证卡的显示层级
            let node = this.spell_handlers[spells.length- i-1]
            let handler = node.node_handler
            handler.self.active = true

            let spell_cfg = spells[i]
            node.spell_cfg = spell_cfg
            node.dices = []
            
            let width = cc.winSize.width+100
            let targetx = target_pos.x
            let targety = target_pos.y
            handler.self.setPosition(new cc.Vec2(width, targety))

            this.scheduleOnce(function(){
                let action = cc.moveTo(1, targetx, targety)
                action.easing(cc.easeInOut(3))
                handler.self.runAction(action)
            }, (spells.length- i)*0.3+0.3)

            handler.name.getComponent(cc.Label).string = spell_cfg.name
            handler.desc.getComponent(cc.RichText).string = spell_cfg.desc.replace(/{(\w+)}/g, function(match, sub, sub2){
                return BattleMain.replace_desc_func(spell_cfg, match, sub, sub2)
            })
            handler.slot_desc.getComponent(cc.Label).string = spell_cfg.slot_desc.replace(/{(\w+)}/g, function(match, sub, sub2){
                return BattleMain.replace_desc_func(spell_cfg, match, sub, sub2)
            })
        }
        for (let i =spells.length; i<this.cached_spell_nodes_count; ++i) {
            let node = this.spell_handlers[i]
            node.node_handler.self.active =false
        }
    }


    get_spell_pos(spell:ISpell, index:number) {
        // 假设只有3张牌，切尺寸都是1格
        return this.spell_pos[index].add(this.spell_pos[index+3]).mul(0.5)
    }

    static dice_slot_img_str = "<img src='dice_slot'/>"
    static replace_desc_func(spell_cfg, match, sub, sub2) {
        if (spell_cfg[sub])  {
            return spell_cfg[sub]
        }
        if (sub == 'total_dice_points') {
            return BattleMain.dice_slot_img_str
        }
        cc.log(sub, spell_cfg)
        return sub
    }

    do_turn() {
        let role:IRole
        let enemy:IRole
        if (this.battle_turn == 'Player') {
            role = this.player
            enemy = this.enemy
        } else {
            role = this.enemy
            enemy = this.player
        }
        //show spells
        this.show_spell_card(role)

        //show dices
        this.show_dices(role)
    }

    end_turn() {
        this.battle_turn = this.battle_turn == 'Player'?'Enemy':'Player'
    }

    init_role(role:IRole){
        role.max_hp = role.hp
    }

    start () {

        let player = 'Player'
        this.player = <IRole>deepCopy( Role.Cfg.robot)
        this.player.side = BattleSide.Player
        this.init_role(this.player)
        this.show_role_info(player, this.player, -100)
        
        let enemy = 'Enemy'
        this.enemy = <IRole>deepCopy(Role.Cfg.warrier)
        this.enemy.side = BattleSide.Player
        this.init_role(this.enemy)
        this.show_role_info(enemy, this.enemy, 100)

        this.battle_turn = 'Player'

        let self = this
        let spell_root = cc.find('SpellRoot', this.node)

        for(let i = 0; i<6; i++) {
            this.spell_pos.push(cc.find('SpellRoot/node'+(i+1), this.node).getPosition())
        }
        
        cc.loader.loadRes('prefab/Spell', cc.Prefab, function(err, res){
            // 预先生成12张卡牌
            for (let i = 0; i < self.cached_spell_nodes_count; ++i) {
                let node = cc.instantiate<cc.Node>(res)
                node.setParent(spell_root)

                let node_handle = self.parse_model(node, null, self.SpellCardModel)
                self.spell_handlers[i] = {node_handler:node_handle}
            }
            self.do_turn()
        })
    }

    update(dt:number) {

    }
    

    // update (dt) {}
}
