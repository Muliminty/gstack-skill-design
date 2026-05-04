import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'gstack 技能设计指南',
    description: '深入理解 Agent Skill 设计——以 gstack 为案例',
    lang: 'zh-CN',
    base: '/gstack-skill-design/',

  themeConfig: {
    nav: [
      { text: 'GitHub', link: 'https://github.com/garrytan/gstack' }
    ],

    sidebar: [
      {
        text: '第一部分：认识与使用',
        items: [
          { text: '1. 总论：什么是 Agent Skill', link: '/' },
          { text: '2. gstack 实战：用 gstack 完成一个闭环项目', link: '/chapters/gstack-in-action' }
        ]
      },
      {
        text: '第二部分：设计原理深度拆解',
        items: [
          { text: '3. 产品层：/office-hours 深度拆解', link: '/chapters/office-hours' },
          { text: '4. 工程层：/plan-eng-review 深度拆解', link: '/chapters/plan-eng-review' },
          { text: '5. 安全层：/cso 深度拆解', link: '/chapters/cso' },
          { text: '6. 发布层：/ship 深度拆解', link: '/chapters/ship' }
        ]
      },
      {
        text: '第三部分：实战',
        items: [
          { text: '7. 设计你自己的 Skill', link: '/chapters/design-your-own' }
        ]
      }
    ],

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    docFooter: {
      prev: '上一章',
      next: '下一章'
    },

    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部'
  }
}),
)
