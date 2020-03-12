const crypto = require('crypto')
const iconv = require('iconv-lite')
/**
 * 待处理签名参数
 * @param {object} obj 
 */
function dealSianParams(obj) {
    return Object.keys(obj).filter(key => obj[key] !== void 0 && obj[key] !== '')
        .sort().map(key => key + '=' + obj[key]).join('&')
}
/**
 * 生成请求ID
 */
function mkRequestId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let noceStr = '', maxPos = chars.length;
    while (length--) noceStr += chars[Math.random() * maxPos | 0];
    return noceStr;
}
/**
 * 获取公共参数
 */
function getCommonParams() {
    return {
        'charset': '00', 'version': '1.0', 'signType': 'RSA',
        'requestId': mkRequestId()
    }
}
/**
 * 签名
 * @param {object} params 
 * @param {buffer} privatePem 
 */
function signature(params, privatePem) {
    const originStr = iconv.encode(dealSianParams(params), 'gbk')
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(originStr)
    return sign.sign(privatePem, 'hex').toUpperCase()
}
/**
 * 验签
 * @param {object} params 
 * @param {buffer} publicPem 
 */
function verifySignature(params, publicPem) {
    let { serverCert, serverSign, ...others } = params
    switch (params.service) {
        case 'QRCodePaymentCommit':
            delete others.service
            delete others.orderId
            delete others.payInfo
            delete others.payOrdNo
            break;
    }
    const originStr = iconv.encode(dealSianParams(others), 'gbk')
    const verifier = crypto.createVerify('RSA-SHA256').update(originStr, 'utf8')
    return verifier.verify(publicPem, new Buffer(serverSign, 'hex').toString('base64'), 'base64')
}

module.exports = {
    dealSianParams, getCommonParams, signature, verifySignature
}