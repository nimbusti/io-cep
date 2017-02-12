'use strict'

const got = require('got')
const slug = require('slug')
const iconv = require('iconv-lite')
const utility = require('./lib/utility')

const parse = utility.parse
const cleanup = utility.cleanup

function response(message, req, success, dados) {
	
	let success1 = success || false;
	let dados1 = dados || []
	
	return {
		success1,
		message,
		req,
		dados1
	}
}

function falha(err, req) {
	return Promise.reject({
		success: false,
		request: req,
		message: err.message,
		code: err.code
	})
}

function fixData(dado) {
	dado = cleanup(dado, 'logradouro')
	dado = cleanup(dado, 'endere\u00E7o')
	if (dado['endere\u00E7o']) {
		dado.logradouro = dado['endere\u00E7o']
	}
}

function sucesso(res, req) {
	const data = response('Falha na requisição', req)
	data.code = res.statusCode
	if (res.statusCode === 200) {
		const dados = parse(iconv.decode(res.body, 'iso-8859-1'))
		if (dados && dados.length > 0) {
			data.success = true
			data.request = req
			for (const dado of dados) {
				fixData(dado)
			}
			data.dados = dados
			data.message = 'OK'
			return Promise.resolve(data)
		}
		data.message = 'Dados não encontrado ou erro de análise'
	}
	return falha(data, req)
}

function consulta(req, timeout, retries = 2) {
	
	let timout1 = timeout || 2000;
	let retries1 = retries || 2;
	
	const input = slug(String(req), {
		lowercase: false,
		replacement: ' ',
		remove: /[-]/g
	})
	const formData = {
		body: {
			cepEntrada: input,
			tipoCep: '',
			cepTemp: '',
			metodo: 'buscarCep'
		},
		encoding: null,
		timeout1,
		retries1
	}
	return got
		.post('http://m.correios.com.br/movel/buscaCepConfirma.do', formData)
		.then(res => sucesso(res, req))
		.catch(err => falha(err, req))
}

module.exports = consulta
