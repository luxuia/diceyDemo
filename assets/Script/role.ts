import './utils/struct'
import BattleMain from './battle';
import Util from './utils/util';


export default class Role {
    max_hp:number
    hp:number
    dice_count:number
    name:string

    cfg:IRoleCfg

    spell_nodes?:ISpellNode[] // 技能ui
    dice_nodes?:IDiceNode[] // 骰子ui
    role_nodes?:IModelNode // 角色信息ui
    side?:BattleSide 

    static RoleModel:IModel = {
        name:'Name',
        career:'Career',
        hp_progress:'HP',
        hp_num:'HP/num',
        dice_root:'Dices',
    }

    dice_node_pool:cc.NodePool

    ease_from_y:number

    constructor(cfg:IRoleCfg) {
        this.hp = cfg.hp
        this.max_hp = cfg.hp
        this.dice_count = cfg.dice_count
        this.cfg = cfg
        this.name = cfg.name
    }
    
    parse_role_ui(role_tag:string, parent_node:cc.Node, ease_from:number) {

        this.ease_from_y = ease_from

        //let handler:ModelNode = {}
        let idx = 0.1
        let handler = Util.parse_model(parent_node, role_tag, Role.RoleModel)
        Object.keys(Role.RoleModel).forEach(key=>{
            let node = handler[key]
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            BattleMain.instance.scheduleOnce(function(){

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

        let dice_handler = Util.parse_model(parent_node, role_tag, dices_model)

        this.dice_nodes = []

        for (let i=1; i<5; ++i) {
            let key = 'dices' + i

            let node = dice_handler[key]

            this.dice_nodes.push({node_handler:{self:node}, dice_info:null})

            node.on(cc.Node.EventType.TOUCH_START, function(event){
                node.opacity = 100
                cc.log('touch begin ', key)
            })
            let self = this
            node.on(cc.Node.EventType.TOUCH_END, function(event:cc.Event.EventTouch){
                node.opacity = 255

                cc.log('touch end ', key)

                for (let key in BattleMain.instance.spell_handlers) {
                    let element = BattleMain.instance.spell_handlers[key].node_handler
                    let bg_com = element.bg1.getComponent(cc.Sprite)
                    if (element.bg1.getBoundingBoxToWorld().contains(event.getLocation())){
                        cc.log("touch in spell card", key)

                        self.try_use_spell(BattleMain.instance.spell_handlers[key], self.dice_nodes[i-1])
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
        this.role_nodes = handler

        this.refresh_role_info()
    }

    refresh_role_info() {
        let handler = this.role_nodes
        handler.hp_num.getComponent(cc.Label).string = `${this.hp}/${this.max_hp}`
        handler.hp_progress.getComponent(cc.ProgressBar).progress = this.hp/this.max_hp
        handler.name.getComponent(cc.Label).string = this.name
        handler.career.getComponent(cc.Label).string = ''
    }

    do_damage_effect(damage:number) {
        let role = BattleMain.instance.get_defender()
        role.hp = role.hp - damage

        this.refresh_role_info()
    }

    show_spell_card() {
        let battle_main = BattleMain.instance

        let spells = this.cfg.spells
        for (let i=0;i<spells.length;++i) {
            let target_pos = battle_main.get_spell_pos(spells[i], i)
            // 保证卡的显示层级
            let node = battle_main.spell_handlers[spells.length- i-1]
            let handler = node.node_handler
            handler.self.active = true

            let spell_cfg = spells[i]
            node.spell_cfg = spell_cfg
            node.dices = []
            
            let width = cc.winSize.width+100
            let targetx = target_pos.x
            let targety = target_pos.y
            handler.self.setPosition(new cc.Vec2(width, targety))

            battle_main.scheduleOnce(function(){
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
        for (let i =spells.length; i<battle_main.cached_spell_nodes_count; ++i) {
            let node = battle_main.spell_handlers[i]
            node.node_handler.self.active =false
        }
    }

    try_use_spell(spell:ISpellNode, dice:IDiceNode) {
        //check can add this dice
        let cfg = spell.spell_cfg
        // 需要骰子，已有骰子数量小于需要的
        if (cfg.slot_count <= 0 && spell.dices.length >= cfg.slot_count) return 
        // 骰子点数大于最大值
        if (cfg.max_limit && cfg.max_limit < dice.dice_info.point) return
        
        spell.dices.push(dice)
        
        // 把骰子放到卡片对应的槽上
        let slot_pos = spell.node_handler.slot.convertToWorldSpaceAR(cc.Vec2.ZERO)
        let dice_root = this.role_nodes.dice_root
        let node_space_pos = dice_root.convertToNodeSpaceAR(slot_pos)
        let dice_action = cc.moveTo(0.2, node_space_pos)
        dice_action.easing(cc.easeInOut(5))
        let dice_node = dice.node_handler.self
        dice_node.runAction(dice_action)

        // 骰子数量不够
        if (cfg.slot_count > spell.dices.length) return

        let self = this
        //伤害计算
        BattleMain.instance.scheduleOnce(function(){
            dice_node.stopAction(dice_action)
            let total_point = 0
            for (let i=0; i < spell.dices.length;++i) {
                total_point+=spell.dices[i].dice_info.point
            }
            let damage = cfg.damage_func(total_point)
            self.do_damage_effect(damage)

            // 移除动画的方向
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
            

            // 移除技能卡片动画
            let old_x = spell.node_handler.self.x
            let action = cc.moveTo(0.5, old_x, targety)
            action.easing(cc.easeInOut(3))
            spell.node_handler.self.runAction(action)

            //移除骰子动画            
            old_x = dice_node.x
            let old_y = dice_node.y
            let dice_local = dice_root.convertToNodeSpaceAR(new cc.Vec2(0, dice_targety))
            cc.log(dice_node, dice_local, targety)
            let node_action = cc.moveTo(0.5, old_x, dice_local.y)
            node_action.easing(cc.easeInOut(3))
            dice_node.runAction(node_action)
        }, 0.2)
    }

    show_dices() {
        let dices = this.dice_nodes
        
        let dice_count = this.dice_count

        let ease_from = this.ease_from_y
        let idx = 0.1
        for (let key=0;key<dice_count; key ++){

            let node = dices[key].node_handler.self
            node.active = true

            let self = this
            cc.loader.loadRes('Texture/dice', cc.SpriteAtlas, function(err, atlas:cc.SpriteAtlas){
                let dice_point = Util.random_int(1, 6)
                let frame = atlas.getSpriteFrame('dice' + dice_point)
                node.getComponent(cc.Sprite).spriteFrame = frame

                dices[key].dice_info = {idx:key, point:dice_point}
            })

            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            BattleMain.instance.scheduleOnce(function(){

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

    hide_dices() {
        for (let i =0; i < this.dice_nodes.length;++i) {
            this.dice_nodes[i].node_handler.self.active = false
        }
    }

    on_attack_start(){
        cc.log('on_attack_start ', this.name)

        // show spells
        this.show_spell_card()

        //show dices
        this.show_dices()
    }

    on_attack_end(){
        cc.log('on_attack_end ', this.name)

        this.hide_dices()
    }
}