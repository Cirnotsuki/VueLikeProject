window.pages.home = new VueLike({
    data() {
        return {
            num: 0,
            name: '啦啦啦啦',
        }
    },

    methods: {
        increase(e) {
            this.num += 1;
        }
    },

    template: `
    <div class="my-vuelike-project" :class="{over10: num > 10}">
        <div>这个名称是：{{name}}, 计数：{{num}}</div>
        <input type="text" v-model="name">
        <button @click.stop.prevent="increase">按钮</button>
    </div>`
})