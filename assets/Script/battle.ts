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

@ccclass
export default class NewClass extends cc.Component {
    model:IModel = {
        panel: 'panel'
    }

    RoleModel:IModel = {
        name:'Name',
        career:'Career',
        HP:'HP',
    }
 
    handler: {[key:string]:cc.Node} = {}
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        
        for (var i=1;i < 5; i++) {
            this.RoleModel['dices' + i] = 'Dices/Dice' + i; 
        }
        let player = 'Player'
        let idx = 0.1
        Object.keys(this.RoleModel).forEach(key=>{
            this.handler[key] = cc.find(player + "/" + this.RoleModel[key], this.node)
            let node = this.handler[key]
            cc.log(node)
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, -100)
            this.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1

            node.on(cc.Node.EventType.MOUSE_DOWN, function(event){
                cc.log(event)
            })
        })
        let enemy = 'Enemy'
        idx = 0.1
        Object.keys(this.RoleModel).forEach(key=>{
            this.handler[key] = cc.find(enemy + "/" + this.RoleModel[key], this.node)
            let node = this.handler[key]
            cc.log(node)
            let old_x = node.x
            let old_y = node.y
            node.setPosition(old_x, -100)
            this.scheduleOnce(function(){

                let action = cc.moveTo(1, old_x, old_y)
                action.easing(cc.easeInOut(3))
                node.runAction(action)
            }, idx)
            idx+=0.1
        })

    }

    update(dt:number) {

    }
    

    // update (dt) {}
}
