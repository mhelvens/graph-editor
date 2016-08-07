var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	devtool: 'source-map',
	entry: {
		'index': [
			'babel-polyfill',
			// 'expose?Zone!zone.js/dist/zone',
			'zone.js',
			'svg-innerhtml',
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
					cacheDirectory: true,
					presets: [
						'es2015',
						'stage-0',
					    'angular2'
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
			{ test: /jquery-powertip$/,                      loader: 'imports?jQuery=jquery' },
			{ test: /jquery\.balancetext\.js$/,              loader: 'imports?jQuery=jquery' },
			{ test: /bootstrap-sass\/assets\/javascripts\//, loader: 'imports?jQuery=jquery' },

			/* bootstrap specific stuff */
			{ test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,  loader: 'url?limit=10000&mimetype=application/font-woff'    },
			{ test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff'    },
			{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,   loader: 'url?limit=10000&mimetype=application/octet-stream' },
			{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,   loader: 'file'                                              },
			{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,   loader: 'url?limit=10000&mimetype=image/svg+xml'            }
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
