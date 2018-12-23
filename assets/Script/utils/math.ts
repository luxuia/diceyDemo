export default class math {
    random_int(min:number, max:number){
        return Math.floor(Math.random()*(max-min+1))+min
    }
}


export function deepCopy(p, c?:{}) {  
    var c = c || {};
    for (var i in p) {  
        if(! p.hasOwnProperty(i)){  
            continue;  
        }  
        if (typeof p[i] === 'object') {  
            c[i] = (p[i].constructor === Array) ? [] : {};  
            deepCopy(p[i], c[i]);  
        } else {  
            c[i] = p[i];  
        }  
    }  
    return c;  
}