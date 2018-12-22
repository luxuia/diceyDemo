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

interface IModel {
    [key : string]:string;
}

interface ModelNode {
    [key: string]:cc.Node
}

import './utils/math'

@ccclass
export default class BattleMain extends cc.Component {

    RoleModel:IModel = {
        name:'Name',
        career:'Career',
        HP:'HP',
    }

    SpellCardModel:IModel = {
        bg1:'bg1',
        bg2:'bg1/bg2',
        name:'bg1/name',
        desc:'bg1/desc',
        slot:'bg1/slot',
        slot_desc:'bg1/slot/desc',
    }

    spell_handlers: {[key:number]:ModelNode} = {}

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    random_int(min:number, max:number){
        return Math.floor(Math.random()*(max-min+1))+min
    }

    parse_model(node:cc.Node, parent:string, model:IModel) {
        let handler:ModelNode = {}
        Object.keys(model).forEach(key=>{
            handler[key] = cc.find(parent + '/' + model[key], node)
        })
        handler['self'] = cc.find(parent, node)
        return handler
    }

    show_role_info(role:string, ease_from:number) {

        //let handler:ModelNode = {}
        let idx = 0.1
        let handler = this.parse_model(this.node, role, this.RoleModel)
        Object.keys(this.RoleModel).forEach(key=>{
            let node = handler[key]
            cc.log(node)
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, ease_from)
            this.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1

            node.on(cc.Node.EventType.TOUCH_START, function(event){
                node.opacity = 100
                cc.log('touch begin ', key)
            })
            let self = this
            node.on(cc.Node.EventType.TOUCH_END, function(event:cc.Event.EventTouch){
                node.opacity = 255

                cc.log('touch end ', key)

                for (let key in self.spell_handlers) {
                    let element = self.spell_handlers[key]
                    let bg_com = element.bg1.getComponent(cc.Sprite)
                    if (element.bg1.getBoundingBoxToWorld().contains(event.getLocation())){
                        cc.log("touch in spell card", key)

                        let old_x = element.self.x
                        let old_y = element.self.y
                        let world_pos = element.self.convertToWorldSpaceAR(cc.Vec2.ZERO)
                        let action = cc.moveTo(1, old_x - world_pos.x-200, old_y)
                        action.easing(cc.easeInOut(3))
                        element.self.runAction(action)

                        old_x = node.x
                        old_y = node.y
                        world_pos = node.convertToWorldSpaceAR(cc.Vec2.ZERO)
                        let node_action = cc.moveTo(1, old_x - world_pos.x-200, old_y)
                        node_action.easing(cc.easeInOut(3))
                        node.runAction(node_action)
                        //node.runAction(action)
                        break
                    }
                };
            })
            node.on(cc.Node.EventType.TOUCH_MOVE, function(event:cc.Event.EventTouch){
                let delta = event.getDelta()
                node.x += delta.x
                node.y += delta.y
            })
        })

        for (let i=1; i<5; ++i) {
            let self = this
            cc.loader.loadRes('Texture/dice', cc.SpriteAtlas, function(err, atlas:cc.SpriteAtlas){
                let dice_count = self.random_int(1, 6)
                let frame = atlas.getSpriteFrame('dice' + dice_count)
                cc.log(dice_count, frame, i)
                handler['dices' + i].getComponent(cc.Sprite).spriteFrame = frame
            })
        }
    }

    show_spell_card() {
    }

    start () {
        
        for (var i=1;i < 5; i++) {
            this.RoleModel['dices' + i] = 'Dices/Dice' + i; 
        }
        let player = 'Player'
        this.show_role_info(player, -100)
        
        let enemy = 'Enemy'
        this.show_role_info(enemy, 100)

        for (let i=1;i<4;i++) {
            let spell_path = 'SpellRoot/Spell' + i
            let node = this.parse_model(this.node, spell_path, this.SpellCardModel)
            this.spell_handlers[i] = node
        }
    }

    update(dt:number) {

    }
    

    // update (dt) {}
}
