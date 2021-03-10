class Node{
    constructor(url,level,id){
        this.title = '';
        this.url = url;
        this.nodeLevel = level;
        this.children = [];
        this.id = id;
    }
    
}

module.exports = Node;