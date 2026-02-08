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

export const toggleNodeChecked = (data, nodeName) => {
    const newData = JSON.parse(JSON.stringify(data));

    let updated = false;
    const traverse = (node) => {
        if (node.name === nodeName && (!node.children || node.children.length === 0)) {
            node.checked = !node.checked;
            updated = true;
            return true;
        }
        if (node.children) {
            for (let child of node.children) {
                if (traverse(child)) return true;
            }
        }
        return false;
    };

    for (let tree of newData) {
        if (traverse(tree)) break;
    }

    return newData;
};

