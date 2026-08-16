function main() {
    // 参数设置 = main.html
    // 使用说明 = intr.html
    // 定时任务 = timer.html
    // 其他 = other.html
    ui.layout("参数设置", "main.html");
    ui.layout("使用说明", "intr.html");
    ui.layout("定时任务", "timer.html");
    ui.layout("其他", "other.html");
    // 注册UI函数与脚本互相交互的例子
    regFuncToScript()

}

function regFuncToScript() {
    // 注册一个 uihello 函数，给脚本使用，让脚本能够调用到这里
    ui.registeFunctionToScript("uihello", function (data) {
        logd("我是registeFunctionToScript的打印:" + data)
        return "我是UI返回的值"
    })
    // 在脚本运行的情况下
    // 3秒后调用 scripthello 函数
    // 脚本不运行 调用不到 scripthello 函数
    ui.run(3000, function () {
        ui.callScriptRegisteFunction("scripthello", "123")
    })
}

main();