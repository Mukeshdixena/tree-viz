export const treeData = {
  name: "Root Node",
  children: [
    {
      name: "Strategy",
      children: [
        { name: "Market Analysis", toggled: true },
        { name: "User Research" },
        { 
          name: "Consultation",
          children: [
             { name: "External" },
             { name: "Internal" }
          ]
        }
      ]
    },
    {
      name: "Development",
      toggled: true,
      children: [
        {
          name: "Frontend",
          children: [
            { name: "React" },
            { name: "Vue" },
            { name: "Svelte" }
          ]
        },
        {
          name: "Backend",
          children: [
            { name: "Node.js" },
            { name: "Python" },
            { name: "Go" }
          ]
        },
        { name: "DevOps", children: [{name: "AWS"}, {name: "Azure"}] }
      ]
    },
    {
      name: "Design",
      children: [
        { name: "UI Design" },
        { name: "UX Flows" },
        { name: "Prototyping" }
      ]
    }
  ]
};
