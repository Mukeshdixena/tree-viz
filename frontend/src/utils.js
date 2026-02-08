export const calculateProgress = (node) => {
    if (!node.children || node.children.length === 0) {
        return {
            total: 1,
            completed: node.checked ? 1 : 0,
            percentage: node.checked ? 100 : 0
        };
    }

    let totalLeafNodes = 0;
    let completedLeafNodes = 0;

    const traverse = (n) => {
        if (!n.children || n.children.length === 0) {
            totalLeafNodes++;
            if (n.checked) completedLeafNodes++;
            return;
        }
        n.children.forEach(traverse);
    };

    traverse(node);

    return {
        total: totalLeafNodes,
        completed: completedLeafNodes,
        percentage: totalLeafNodes > 0 ? Math.round((completedLeafNodes / totalLeafNodes) * 100) : 0
    };
};

export const toggleNodeChecked = (tree, nodeName) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    const traverse = (node) => {
        if (node.name === nodeName && (!node.children || node.children.length === 0)) {
            node.checked = !node.checked;
            return true;
        }
        if (node.children) {
            for (let child of node.children) {
                if (traverse(child)) return true;
            }
        }
        return false;
    };
    traverse(newTree);
    return newTree;
};

export const editNodeName = (tree, oldName, newName) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    const traverse = (node) => {
        if (node.name === oldName) {
            node.name = newName;
            return true;
        }
        if (node.children) {
            for (let child of node.children) {
                if (traverse(child)) return true;
            }
        }
        return false;
    };
    traverse(newTree);
    return newTree;
};

export const addNodeChild = (tree, parentName, childName) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    const traverse = (node) => {
        if (node.name === parentName) {
            if (!node.children) node.children = [];
            node.children.push({ name: childName, checked: false, children: [] });
            return true;
        }
        if (node.children) {
            for (let child of node.children) {
                if (traverse(child)) return true;
            }
        }
        return false;
    };
    traverse(newTree);
    return newTree;
};

export const deleteNodeInTree = (tree, nodeName) => {
    const newTree = JSON.parse(JSON.stringify(tree));

    // If it's the root itself, return null to indicate full deletion
    if (newTree.name === nodeName) return null;

    const traverse = (parent, node, index) => {
        if (node.name === nodeName) {
            parent.children.splice(index, 1);
            return true;
        }
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                if (traverse(node, node.children[i], i)) return true;
            }
        }
        return false;
    };

    traverse(null, newTree, 0);
    return newTree;
};

