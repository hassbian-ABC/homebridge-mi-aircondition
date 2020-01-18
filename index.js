var fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiAirCondition")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-aircondition', 'MiAirCondition', MiAirCondition);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiAirCondition(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;
    
    this.log.info("[MiAirCondition][INFO]***********************************************************");
    this.log.info("[MiAirCondition][INFO]           MiAirCondition v%s by hassbian-ABC 0.1.0");
    this.log.info("[MiAirCondition][INFO]  GitHub: https://github.com/hassbian-ABC/homebridge-mi-aircondition ");
    this.log.info("[MiAirCondition][INFO]                                                                  ");
    this.log.info("[MiAirCondition][INFO]***********************************************************");
    this.log.info("[MiAirCondition][INFO]start success...");


    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token
		
    });
}

MiAirCondition.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var that = this;
        var services = [];
		this.temp = 32.0;

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "xiaomi")
            .setCharacteristic(Characteristic.Model, "smartmi")
            .setCharacteristic(Characteristic.SerialNumber, this.config.ip);
        services.push(infoService);
		
	    var heaterService = new Service.HeaterCooler(this.name);
        var currentTemperatureCharacteristic = heaterService.getCharacteristic(Characteristic.CurrentTemperature);
        var currentHeaterCoolerStateCharacteristic = heaterService.getCharacteristic(Characteristic.CurrentHeaterCoolerState);
        var targetHeaterCoolerStateCharacteristic = heaterService.getCharacteristic(Characteristic.TargetHeaterCoolerState);
        var activeCharacteristic = heaterService.getCharacteristic(Characteristic.Active);
		var coolingThresholdTemperatureCharacteristic = heaterService.getCharacteristic(Characteristic.CoolingThresholdTemperature);
        var heatingThresholdTemperatureCharacteristic = heaterService.getCharacteristic(Characteristic.HeatingThresholdTemperature);
		var swingModeCharacteristic = heaterService.getCharacteristic(Characteristic.SwingMode);
		var rotationSpeedCharacteristic = heaterService.getCharacteristic(Characteristic.RotationSpeed);
		
		setInterval(function() {
        currentTemperatureCharacteristic.getValue();
        swingModeCharacteristic.getValue();
        targetHeaterCoolerStateCharacteristic.getValue();
        activeCharacteristic.getValue();
        coolingThresholdTemperatureCharacteristic.getValue();        
        heatingThresholdTemperatureCharacteristic.getValue();
		rotationSpeedCharacteristic.getValue();
        }, 3000);

		
		coolingThresholdTemperatureCharacteristic
		   .setProps({
		        minValue: 16.0, 
                maxValue: 32.0, 
                minStep: 0.1, 
            });
			
		heatingThresholdTemperatureCharacteristic
		    .setProps({
		        minValue: 16.0, 
                maxValue: 32.0, 
                minStep: 0.1, 
            });
		rotationSpeedCharacteristic
            .setProps({
		        minValue: 0, 
                maxValue: 5, 
                minStep: 1, 
            });		
			
		activeCharacteristic
		   .on('get', function(callback) {
			   //that.device.call("get_prop", ["power", "mode", "st_temp_dec", "temp_dec", "vertical_swing", "speed_level", "comfort"]).then(result => {
				   that.device.call("get_prop", ["power"]).then(result => {
		            that.log.debug("[MiHeater][DEBUG]activeCharacteristic - get: " + result);
					if (result[0] === "on") {
						callback(null, 1);
					} else if (result[0] === "off") {
						callback(null, 0);
						currentHeaterCoolerStateCharacteristic.updateValue(0);
					}
					/*if (result[6] === "off") {
						if (result[1] === "cooling") {
							targetHeaterCoolerStateCharacteristic.updateValue(2);
							coolingThresholdTemperatureCharacteristic.updateValue(result[2] / 10);
							currentHeaterCoolerStateCharacteristic.updateValue(3);
						} else if (result[1] === "heat") {
							targetHeaterCoolerStateCharacteristic.updateValue(1);
							heatingThresholdTemperatureCharacteristic.updateValue(result[2] / 10);
							currentHeaterCoolerStateCharacteristic.updateValue(2);
						} else {
							targetHeaterCoolerStateCharacteristic.updateValue(0);
							coolingThresholdTemperatureCharacteristic.updateValue(result[2] / 10);
							heatingThresholdTemperatureCharacteristic.updateValue(this.temp);
						}
					} else {
						targetHeaterCoolerStateCharacteristic.updateValue(0);
						coolingThresholdTemperatureCharacteristic.updateValue(result[2] / 10);
						heatingThresholdTemperatureCharacteristic.updateValue(this.temp);
					}
					if (result[4] === "on") {
						swingModeCharacteristic.updateValue(1);
					} else if (result[4] === "off") {
						swingModeCharacteristic.updateValue(0);
					}
				
					rotationSpeedCharacteristic.updateValue(result[4]);
					currentTemperatureCharacteristic.updateValue(result[3] / 10);
					*/
					}).catch(function(err) {
			    that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                callback(err);
            });
            }.bind(this))
			.on('set', function(value, callback) {
		         that.log.debug("[MiHeater][DEBUG]activeCharacteristic - set_active: " + value);
				 if (value == activeCharacteristic.value) {
				    callback(null);
		         } else {
                 that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
			           that.log.debug("[MiHeater][DEBUG]activeCharacteristic - set_active: " + err);
                       callback(err);
                    });
				 }
            }.bind(this));
					
		currentTemperatureCharacteristic
            .on('get', function(callback) {
				that.device.call("get_prop", ["temp_dec"]).then(result => {
				callback(null, result[0] / 10);
				}).catch(function(err) {
			    that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                callback(err);
            });
            }.bind(this));		
		
        swingModeCharacteristic  
		    .on('get', function(callback) {
				that.device.call("get_prop", ["vertical_swing"]).then(result => {
					if (result[0] === "on") {
						callback(null, 1);
					} else if (result[0] === "off") {
						callback(null, 0);
					}
				}).catch(function(err) {
			    that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                callback(err);
            });
            }.bind(this))
					
            .on('set', function(value, callback) {
                that.device.call("set_vertical", [value ? "on" : "off"]).then(result => {
			    that.log.debug("[MiHeater][DEBUG]swingModeCharacteristic - setSwingModeCharacteristic Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));result[4]
                    }            
                }).catch(function(err) {
				    that.log.error("[MiHeater][DEBUG]swingModeCharacteristic - setSwingModeCharacteristic Error: " + err);
                callback(err);
            });
        }.bind(this));
		
		targetHeaterCoolerStateCharacteristic
		    .on('get', function(callback) {
				    that.device.call("get_prop", ["mode", "comfort"]).then(result => {
					//that.log("[MiHeater][DEBUG]targetHeaterCooler - gettargetHeaterCooler: " + result);
					if (result[1] === "off") {
						if (result[0] === "cooling") {
							callback(null, 2);
							currentHeaterCoolerStateCharacteristic.updateValue(3);
						} else if (result[0] === "heat") {
							callback(null, 1);
							currentHeaterCoolerStateCharacteristic.updateValue(2);
						} else {
							callback(null, 0);
						}
					} else if (result[1] === "on") {
						callback(null, 0);
					}
				    }).catch(function(err) {
                    callback(err);
                    });
            }.bind(this))
		    .on('set', function(value, callback) {
				that.log("[MiHeater][DEBUG]targetHeaterCoolerState - set_targetHeaterCoolerState: " + value);
				if (value == targetHeaterCoolerStateCharacteristic.value) {
				    callback(null);
		         } else {
				if (value === 0) {
					that.device.call("set_comfort", ["on"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                      }).catch(function(err) {
			           that.log.debug("[MiHeater][DEBUG]targetHeaterCoolerState - set_targetHeaterCoolerState: " + err);
                       callback(err);
                      });
				} else if (value === 1) {
					that.device.call("set_mode", ["heat"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                      }).catch(function(err) {
			           that.log.debug("[MiHeater][DEBUG]targetHeaterCoolerState - set_targetHeaterCoolerState: " + err);
                       callback(err);
                      });
				} else {
					that.device.call("set_mode", ["cooling"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                      }).catch(function(err) {
			           that.log.debug("[MiHeater][DEBUG]targetHeaterCoolerState - set_targetHeaterCoolerState: " + err);
                       callback(err);
                      });
				}
				 }
			}.bind(this));
			
			coolingThresholdTemperatureCharacteristic
			    .on('get', function(callback) {
				    that.device.call("get_prop", ["st_temp_dec"]).then(result => {
						callback(null, result[0] / 10);
						}).catch(function(err) {
			        that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                    callback(err);
                    });
                }.bind(this))
						
			    .on('set', function(value, callback) {
					if (value == coolingThresholdTemperatureCharacteristic.value) {
				       callback(null);
		            } else {
					that.device.call("set_temperature", [value * 10]).then(result => {
			        that.log.debug("[MiHeater][DEBUG]coolingThresholdTemperature - setCoolingThresholdTemperature Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));result[4]
                    }            
                    }).catch(function(err) {
				    that.log.error("[MiHeater][DEBUG]coolingThresholdTemperature - setCoolingThresholdTemperature Error: " + err);
                    callback(err);
                });
					}
            }.bind(this));
                    						
            heatingThresholdTemperatureCharacteristic
			    .on('get', function(callback) {
					if (targetHeaterCoolerStateCharacteristic.value === Characteristic.TargetHeaterCoolerState.AUTO) {
						callback(null, this.temp);
					} else {
				    that.device.call("get_prop", ["st_temp_dec"]).then(result => {
						callback(null, result[0] / 10);
						}).catch(function(err) {
			        that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                    callback(err);
                    });
					}
                }.bind(this))
			    .on('set', function(value, callback) {
					if (value == heatingThresholdTemperatureCharacteristic.value) {
				       callback(null);
		            } else {
					if (targetHeaterCoolerStateCharacteristic.value === Characteristic.TargetHeaterCoolerState.AUTO) {
						this.temp = value;
					    callback(null);
				    } else {
					that.device.call("set_temperature", [value * 10]).then(result => {
			        that.log.debug("[MiHeater][DEBUG]heatingThresholdTemperature - setHeatingThresholdTemperature Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));result[4]
                    }            
                    }).catch(function(err) {
				    that.log.error("[MiHeater][DEBUG]heatingThresholdTemperature - setHeatingThresholdTemperature Error: " + err);
                    callback(err);
                });
					}
					}
            }.bind(this));
			
			rotationSpeedCharacteristic
			    .on('get', function(callback) {
				    that.device.call("get_prop", ["speed_level"]).then(result => {
					callback(null, result[0]);
				    }).catch(function(err) {
			        that.log.error("[MiHeater][DEBUG]activeCharacteristic - getActive Error: " + err);
                    callback(err);
                    });
                }.bind(this))
			    .on('set', function(value, callback) {
					if (value == rotationSpeedCharacteristic.value) {
				       callback(null);
		            } else {
					that.device.call("set_spd_level", [value]).then(result => {
			        that.log.debug("[MiHeater][DEBUG]rotationSpeedCharacteristic - setRotationSpeedCharacteristic Result: " + result);
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                        callback(new Error(result[0]));result[4]
                    }            
                    }).catch(function(err) {
				    that.log.error("[MiHeater][DEBUG]rotationSpeedCharacteristic - setRotationSpeedCharacteristic Error: " + err);
                    callback(err);
                });
					}
            }.bind(this));
		services.push(heaterService);
		
	    var windService = new Service.Switch("送风", "送风");
		var windOnCharacteristic = windService.getCharacteristic(Characteristic.On);
		setInterval(function() {
			windOnCharacteristic.getValue();
		}, 10000);
		windOnCharacteristic
		    .on('get', function(callback) {
		        that.device.call("get_prop", ["mode", "comfort", "power"]).then(result => {
					//console.log("get_windOnCharacteristic", result);
				if (result[1] === "off" && result[0] === "wind" && result[2] === "on") {
					callback(null, 1);
				} else {
					callback(null, 0);
				}   
	            }).catch(function(err) {
                    callback(err);
                });
				//console.log("windOnCharacteristic.value", windOnCharacteristic.value);
            }.bind(this))
		    .on('set', function(value, callback) {
				//console.log("set_windOnCharacteristic", value);
				if (value === true) {
					that.device.call("set_mode", ["wind"]).then(result => {
						//console.log("set_windOnCharacteristic", result);
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
                       callback(err);
                    });
				} else {
					that.device.call("set_power", ["off"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
                       callback(err);
                    });
				}
			}.bind(this));
					 
    
	    services.push(windService);
		
		var ptcService = new Service.Switch("电辅热", "电辅热");
		var ptcOnCharacteristic = ptcService.getCharacteristic(Characteristic.On);
		setInterval(function() {
			ptcOnCharacteristic.getValue();
		}, 10000);
		ptcOnCharacteristic
		    .on('get', function(callback) {
		        that.device.call("get_prop", ["ptc"]).then(result => {
					if (result[0] === "on") {
						callback(null, 1);
					} else if (result[0] === "off") {
						callback(null, 0);
					}
	            }).catch(function(err) {
                    callback(err);
                });
            }.bind(this))
			.on('set', function(value, callback) {
				that.device.call("set_ptc", [value ? "on" : "off"]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
                       callback(err);
                    });
				}.bind(this));
					
	    services.push(ptcService);
		
		var lightService = new Service.Lightbulb("屏幕亮度", "屏幕亮度");
		var lightOnCharacteristic = lightService.getCharacteristic(Characteristic.On);
		var lightBrightnessCharacteristic = lightService.getCharacteristic(Characteristic.Brightness);
		lightBrightnessCharacteristic
		    .setProps({
		        minValue: 0, 
                maxValue: 5, 
                minStep: 1, 
            });
		setInterval(function() {
			lightOnCharacteristic.getValue();
			lightBrightnessCharacteristic.getValue();
		}, 10000);
		lightOnCharacteristic
		    .on('get', function(callback) {
		        that.device.call("get_prop", ["power", "lcd_level"]).then(result => {
					//console.log("get_lightOnCharacteristic", result);
					if (result[0] === "off") {
						callback(null, 0);
					} else if (result[0] === "on") {
						if (result[1] === 0) {
							callback(null, 0);
						} else if (result[1] !== 0) {
							callback(null, 1);
						}
					}
				}).catch(function(err) {
                    callback(err);
                });
            }.bind(this));
			.on('set', function(value, callback) {
				console.log("set_lightOnCharacteristic", value);
				if (value === lightOnCharacteristic.value) {
					callback(null);
				} else {
				if (value === 1) {
					if (lightBrightnessCharacteristic.value !== 0) {
						this.light = lightBrightnessCharacteristic.value;
					} else {
						this.light = 5;
					}
					that.device.call("set_lcd", [this.light]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
                       callback(err);
                    });
				} else {
					that.device.call("set_lcd", [0]).then(result => {
                       if(result[0] === "ok") {
                        callback(null);
                       } else {
                         callback(new Error(result[0]));
                       }            
                    }).catch(function(err) {
                       callback(err);
                    });
				}
				}
			}.bind(this));
			
		lightBrightnessCharacteristic
		    .on('get', function(callback) {
				that.device.call("get_prop", ["lcd_level"]).then(result => {
					//console.log("get_lightBrightnessCharacteristic", result);
				callback(null, result[0]);
				}).catch(function(err) {
                    callback(err);
                });
            }.bind(this))
			.on('set', function(value, callback) {
				//console.log("set_lightBrightnessCharacteristic", value);
				that.device.call("set_lcd", [value]).then(result => {
                    if(result[0] === "ok") {
                        callback(null);
                    } else {
                         callback(new Error(result[0]));
                    }            
                }).catch(function(err) {
                    callback(err);
                });
			}.bind(this));
		
		
		services.push(lightService);
    return services;

	} 	
}
