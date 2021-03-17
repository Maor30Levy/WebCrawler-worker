const Node = require("./node");

const setChildrenNodes = (childrenURLsArray, level, parentID) => {
    const nodesArray = [];
    for (let i = 0; i < childrenURLsArray.length; i++) {
        const footer = i > 9 ? `/${i}/` : i;
        nodesArray.push(new Node(childrenURLsArray[i], level, parentID + footer));
    }
    return nodesArray;
}

const getChildrenURLs = (children) => {
    const urlArray = [];
    children.forEach((child) => { urlArray.push(child.url) });
    return urlArray;
}

const setNodeByID = (id, newNode, root = undefined) => {
    if (id.length === 1) return newNode;
    let node = root;
    let workID = id;
    for (let i = 0; i < workID.length - 1; i++) {
        let footer;
        if (workID[i + 1] === '/') {
            const result = markersHandler(workID.slice(i + 1));
            workID = workID.slice(0, i + 1) + result.id;
            footer = result.num;
        } else footer = workID[i + 1];
        if (i + 1 === workID.length - 1) node.children[footer] = newNode;
        else node = node.children[footer];
    }
    return root;
}

const markersHandler = (id) => {
    let workID = id;
    for (let i = 1; i < workID.length; i++) {
        if (workID[i] === '/') {
            const sub = workID.substring(0, i + 1);
            workID = workID.replace(sub, '$');
            const num = parseInt(sub.slice(1, sub.length - 1));
            return { num, id: workID }
        }
    }
};




module.exports = {
    setChildrenNodes,
    getChildrenURLs,
    setNodeByID
};