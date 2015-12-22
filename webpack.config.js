var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	entry: {
		'index': [
			'babel-core/polyfill',
			'./src/util/polyfills.es6.js',
			'reflect-metadata',
			'expose?Zone!zone.js',
			'./src/index.es6.js'
		]
	},
	output: {
		path: './dist',
		filename: '[name].js',
		sourceMapFilename: '[file].map'
	},
	module: {
		loaders: [
			{
				test: /\.es6\.js$/,
				loader: 'babel',
				query: {
					compact: false,
					optional: [
						'es7.decorators',
						'es7.classProperties',
						'es7.functionBind'
					]
				}
			},
			{ test: /\.json$/,  loader: 'json'                        },
			{ test: /\.css$/,   loader: 'style!css!autoprefixer'      },
			{ test: /\.scss$/,  loader: 'style!css!autoprefixer!sass' },
			{ test: /\.png$/,   loader: 'url'                         },
			{ test: /^jquery$/, loader: 'expose?$!expose?jQuery'      },
			
			/* inject jQuery for libraries that need it */
			{ test: /golden-layout$/,                        loader: 'imports?jQuery=jquery' },
			{ test: /jquery\.balancetext\.js$/,              loader: 'imports?jQuery=jquery' },
			{ test: /bootstrap-sass\/assets\/javascripts\//, loader: 'imports?jQuery=jquery' },

			/* bootstrap specific stuff */
			{ test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,  loader: 'url?limit=10000&minetype=application/font-woff'    },
			{ test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&minetype=application/font-woff'    },
			{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,   loader: 'url?limit=10000&minetype=application/octet-stream' },
			{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,   loader: 'file'                                              },
			{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,   loader: 'url?limit=10000&minetype=image/svg+xml'            }
		]
	},
	sassLoader: {
		// https://github.com/twbs/bootstrap-sass/issues/409
		// https://github.com/sass/node-sass#precision
		precision: 10
	},
	plugins: [
		new HtmlWebpackPlugin({
			title:    "Graph Editor",
			filename: 'index.html'
		})
	]
};
