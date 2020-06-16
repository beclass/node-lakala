# 拉卡拉支付 for nodejs

## 功能概述
- `支付宝-APP支付` 
- `支付宝-扫码支付`
- `微信-APP支付`
- `微信-JSAPI支付`
- `微信-扫码支付`
- `微信-小程序支付`
- `查询订单`
- `异步通知`


## 使用前必读
#### 版本要求
nodejs >= 8.5.0


#### 关于错误
> API对所有错误进行了处理, 统一通过error返回, 包括:

- `网络类错误` - 网络中断, 连接超时等
- `请求回调返回签名校验`
- `其它错误` - 应传参数未传入等

#### 关于返回值
> 正常返回为JSON格式数据

## 安装
```Bash
npm i lakala

# 如已安装旧版, 重新安装最新版
npm i lakala@latest
```

## 实例化
```javascript
const lakala = require('lakala');
const config = {
    merchant_id: '商户id',
    api_url: 'api请求url',
    notify_url: '异步通知url',
    private_key_pem: fs.readFileSync('私钥.pem'),
    public_key_pem: fs.readFileSync('公钥.pem'),
};
const api = lakala.init(config)

// 调试模式(传入第二个参数为true, 可在控制台输出数据)
const api = lakala.init(config,true)
```

#### config说明:
- `merchant_id` - 商户编号(必填)
- `api_url` - api请求地址(必填)
- `notify_url` - 支付结果通知回调地址(必填)
  - 可以在初始化的时候传入设为默认值, 不传则需在调用相关API时传入
  - 调用相关API时传入新值则使用新值


## API 列表
- 某些API预设了某些必传字段的默认值, 调用时不传参数则使用默认值
- 初始化时已传入的参数无需调用时重复传入, 如`merchant_id` `证书` 
- 签名(sign)会在调用API时自动处理, 无需手动传入
- 请求号(requestId)会在调用API时自动处理, 无需手动传入


### payment: 预下单(自动下单，返回支付token)
```javascript
let result = await api.payment({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  amount: '订单金额(分)',
  body: '商品名称'
});
```

### quickPayment: 快捷支付(自动下单，返回支付表单)
```javascript
let result = await api.quickPayment({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  amount: '订单金额(分)',
  body: '商品名称'
});
```

### aliApp: 支付宝-APP支付
```javascript
let result = await api.aliApp({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
});
```

### aliNative: 支付宝-扫码支付
```javascript
let result = await api.aliNative({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
});
```

### wxApp: 微信-APP支付
```javascript
let result = await api.wxApp({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
  appId: '公众号id',
  openId: '付款用户的openid'
});
```

### wxJsApi: 微信-JSAPI支付
```javascript
let result = await api.wxJsApi({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
  appId: '公众号id',
  openId: '付款用户的openid'
});
```

### wxNative: 微信-扫码支付
```javascript
let result = await api.wxNative({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
  appId: '公众号id',
  openId: '付款用户的openid'
});
```

### wxMiniApp: 微信-小程序支付
```javascript
let result = await api.wxMiniApp({
  orderId: '订单id',
  orderTime: '订单时间yyyymmddhhmmss',
  token: '预下单返回的token',
  appId: '小程序id',
  openId: '付款用户的openid'
});
```

### queryOrder: 查询订单
```javascript
let result = await api.queryOrder(订单id);
```

### notify: 异步结果通知
```javascript
let result = await api.notify(body);
```









