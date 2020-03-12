const urllib = require('urllib')
const util = require('./util')
const iconv = require('iconv-lite')
class API {
    constructor({ merchant_id, notify_url, private_key_pem, public_key_pem, client_ip = '127.0.0.1', sandbox = false } = {}, debug = false) {
        if (!merchant_id) throw new Error('merchant_id not fail')
        this.merchantId = merchant_id
        this.notifyUrl = notify_url
        this.privatePem = private_key_pem
        this.publicPem = public_key_pem
        this.clientIp = client_ip
        this.url = sandbox ? 'https://10.177.89.158/mrpos/cashier' : 'https://intpay.lakala.com/mrpos/cashier'
        this.debug = debug
    }
    log(...args) {
        if (this.debug) console.log(...args)
    }
    static init(...args) {
        return new API(...args)
    }
    /**
     * 快捷支付
     * @param {object} params 
     */
    async quickPayment(params) {
        params.service = 'EntMergeQuickPayment'
        return this.makeOrder(params)
    }
    /**
     * 预下单
     * @param {object} params 
     */
    async payment(params) {
        params.service = 'EntOffLinePayment'
        return this.makeOrder(params)
    }
    /**
     * 下单
     * @param {object} params 
     */
    async makeOrder(params) {
        let orderDetail = [{
            'productDesc': '',
            'orderSeqNo': '001',
            'productId': '',
            'rcvMerchantId': this.merchantId,
            'detailOrderId': params.orderId,
            'rcvMerchantIdName': '', //收款方商户名称
            'showUrl': '',
            'orderAmt': params.amount,
            'shareFee': '0',
            'productName': params.body
        }]
        if (params.rcvMerchantIdName) {
            orderDetail[0].rcvMerchantIdName = params.rcvMerchantIdName
            delete params.rcvMerchantIdName
        }
        let orderInfo = {
            'merchantId': this.merchantId,
            'service': params.service,
            'offlineNotifyUrl': this.notifyUrl,
            'pageNotifyUrl': '',
            'clientIP': this.clientIp,
            'orderId': params.orderId,
            'orderTime': params.orderTime,
            'totalAmount': params.amount,
            'currency': 'CNY',
            'splitType': '1',
            'validUnit': '00',
            'validNum': '15',
            'orderDetail': JSON.stringify(orderDetail),
            'backParam': params.backParam
        }
        if (params.pageNotifyUrl) orderInfo.offlineNotifyUrl = params.pageNotifyUrl
        if (params.validUnit) orderInfo.validUnit = params.validUnit
        if (params.validNum) orderInfo.validNum = params.validNum
        orderInfo = Object.assign(util.getCommonParams(), orderInfo)
        orderInfo.merchantSign = util.signature(orderInfo, this.privatePem)
        if (params.service == 'EntMergeQuickPayment') {
            let form = '<form id="lakalaBossForm" action="https://intpay.lakala.com/mrpos/cashier" method="post" accept-charset="GBK">\n';
            for (let key in orderInfo) {
                if (key == 'orderDetail') {
                    form += '<input type="hidden" name="' + key + '" value=\'' + orderInfo[key] + '\'>\n'
                } else {
                    form += '<input type="hidden" name="' + key + '" value="' + orderInfo[key] + '">\n'
                }
            }
            form += '<input type="submit" value="submit">\n'
            form += '<script>document.getElementById("lakalaBossForm").submit();</script>\n'
            form += '</form>'
            return form
        }
        return this._request(orderInfo)
    }
    /**
     * 支付
     * @param {object} params 
     */
    async pay(params) {
        params.merchantId = this.merchantId
        params.service = 'QRCodePaymentCommit'
        params.clientIP = this.clientIp
        params = Object.assign(util.getCommonParams(), params)
        params.merchantSign = util.signature(params, this.privatePem)
        return this._request(params)
    }
    /**
     * 支付宝-APP支付
     * @param {string} orderId 
     * @param {string} orderTime 
     * @param {string} token 
     */
    async aliApp(orderId, orderTime, token) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), payChlTyp: 'ALIPAY', tradeType: 'ALIAPP' })
    }
    /**
     * 支付宝-扫码支付
     */
    async aliNative(orderId, orderTime, token) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), payChlTyp: 'ALIPAY', tradeType: 'ALINATIVE' })
    }
    /**
     * 微信-APP支付
     * @param {string} orderId 
     * @param {string} orderTime 
     * @param {string} token 
     * @param {string} appId 公众号appid
     * @param {string} openId 用户openid
     */
    async wxApp(orderId, orderTime, token, appId, openId) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), appId, openId, payChlTyp: 'WECHAT', tradeType: 'WECHATAPP' })
    }
    /**
     * 微信-JSAPI支付
     */
    async wxJsApi(orderId, orderTime, token, appId, openId) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), appId, openId, payChlTyp: 'WECHAT', tradeType: 'JSAPI' })
    }
    /**
     * 微信-扫码支付
     */
    async wxNative(orderId, orderTime, token, appId, openId) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), appId, openId, payChlTyp: 'WECHAT', tradeType: 'WXNATIVE' })
    }
    /**
     * 微信-小程序支付
     */
    async wxMiniApp(orderId, orderTime, token, appId, openId) {
        return this.pay({ orderId, token, creDt: orderTime.substr(0, 8), appId, openId, payChlTyp: 'WECHAT', tradeType: 'MINIAPP' })
    }
    /**
     * 查询订单
     * @param {string} orderId 
     */
    async queryOrder(orderId) {
        let params = Object.assign(util.getCommonParams(), { orderId, merchantId: this.merchantId, service: 'EntMergeOrderSearch' })
        params.merchantSign = util.signature(params, this.privatePem)
        return this._request(params)
    }
    /**
     * @param {object} params 
     */
    async _request(params) {
        const pkg = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            encoding: null,
            content: iconv.encode(JSON.stringify(params), 'gbk'),
            timeout: 5000,
        }
        this.log('post data =>\r\n%s\r\n', pkg.content)
        let { status, data } = await urllib.request(this.url, pkg)
        if (status !== 200) throw new Error('request fail')
        data = iconv.decode(data, 'gb2312').toString()
        data = JSON.parse(data)
        if (['000000', 'MCG00000'].indexOf(data.returnCode) < 0) throw { errcode: data.returnCode, errmsg: data.returnMessage }
        if (!util.verifySignature(data, this.publicPem)) throw { errmsg: '签名校验错误' }
        this.log('receive data =>\r\n%s\r\n', JSON.stringify(data))
        return data
    }
    /**
     * 异步通知
     * @param {object} body 
     */
    async notify(body){
        if(body.status!='SUCCESS') throw { errcode: data.returnCode, errmsg: data.failMsg }
        if(body.backParam) body.backParam = new Buffer(body.backParam,'base64').toString()
        if(body.failMsg) body.failMsg = new Buffer(body.failMsg,'base64').toString()
        if(body.returnMessage) body.returnMessage = new Buffer(body.returnMessage,'base64').toString()
        if (!util.verifySignature(body, this.publicPem)) throw { errmsg: '签名校验错误' }
        body.orderDetail = JSON.parse(new Buffer(body.orderDetail,'base64').toString())
        delete body.serverCert
        delete body.serverSign
        return body
    }
}
module.exports = API