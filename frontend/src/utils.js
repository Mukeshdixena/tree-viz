export const calculateProgress = (node) => {
    let totalLeafNodes = 0;
    let weightedCompletion = 0;

    const traverse = (n) => {
        // A node is a leaf if it has no children OR an empty children array
        if (!n.children || n.children.length === 0) {
            totalLeafNodes++;

            // Support legacy 'checked' and new 'status'
            if (n.status === 'done' || n.checked === true) {
                weightedCompletion += 1;
            } else if (n.status === 'in-progress') {
                weightedCompletion += 0.5;
            }
            return;
        }
        n.children.forEach(traverse);
    };

    traverse(node);

    return {
        total: totalLeafNodes,
        completed: weightedCompletion,
        percentage: totalLeafNodes > 0 ? Math.round((weightedCompletion / totalLeafNodes) * 100) : 0
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

export const setNodeStatus = (tree, nodeName, status) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    const traverse = (node) => {
        if (node.name === nodeName) {
            node.status = status;
            node.checked = status === 'done';
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

export const updateNodeData = (tree, nodeName, updates) => {
    const newTree = JSON.parse(JSON.stringify(tree));
    const traverse = (node) => {
        if (node.name === nodeName) {
            Object.assign(node, updates);
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
    if (!tree) return null;
    const newTree = JSON.parse(JSON.stringify(tree));

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

