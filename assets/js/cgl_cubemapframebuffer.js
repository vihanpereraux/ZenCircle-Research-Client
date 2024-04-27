(()=>{"use strict";class t{constructor(t){this._logs=[],this.initiator=t}stack(t){console.info("["+this.initiator+"] ",t),console.log((new Error).stack)}groupCollapsed(t){console.groupCollapsed("["+this.initiator+"] "+t)}table(t){console.table(t)}groupEnd(){console.groupEnd()}error(t){console.error("["+this.initiator+"]",...arguments),window.gui&&window.gui.emitEvent("coreLogEvent",this.initiator,"error",arguments)}info(t){console.error("["+this.initiator+"]",...arguments),window.gui&&window.gui.emitEvent("coreLogEvent",this.initiator,"info",arguments)}warn(t){console.warn("["+this.initiator+"]",...arguments),window.gui&&window.gui.emitEvent("coreLogEvent",this.initiator,"warn",arguments)}verbose(){(CABLES.UI&&CABLES.UI.logFilter.shouldPrint(this.initiator,...arguments)||!CABLES.logSilent)&&console.log("["+this.initiator+"]",...arguments),window.gui&&window.gui.emitEvent("coreLogEvent",this.initiator,"verbose",arguments)}log(t){(CABLES.UI&&CABLES.UI.logFilter.shouldPrint(this.initiator,...arguments)||!CABLES.logSilent)&&console.log("["+this.initiator+"]",...arguments),window.gui&&window.gui.emitEvent("coreLogEvent",this.initiator,"log",arguments)}userInteraction(t){}}const e=function(i,r={}){if(!i)throw new Error("no cgl");this._log=new t("cgl_texture"),this._cgl=i,this.pixelFormat=r.pixelFormat||e.PFORMATSTR_RGBA8UB,this.tex=this._cgl.gl.createTexture(),this.id=CABLES.uuid(),this.width=0,this.height=0,this.loading=!1,this.flip=!0,this.flipped=!1,this.shadowMap=!1,this.deleted=!1,this.image=null,this.anisotropic=0,this.filter=e.FILTER_NEAREST,this.wrap=e.WRAP_CLAMP_TO_EDGE,this.texTarget=this._cgl.gl.TEXTURE_2D,r&&r.type&&(this.texTarget=r.type),this.textureType=e.TYPE_DEFAULT,this.unpackAlpha=!0,this._fromData=!0,this.name="unknown",this._glDataType=-1,this._glInternalFormat=-1,this._glDataFormat=-1,r?(this.name=r.name||this.name,r.isDepthTexture&&(this.textureType=e.TYPE_DEPTH),!0===r.isFloatingPointTexture&&(this.textureType=e.TYPE_FLOAT),"textureType"in r&&(this.textureType=r.textureType),"filter"in r&&(this.filter=r.filter),"wrap"in r&&(this.wrap=r.wrap),"unpackAlpha"in r&&(this.unpackAlpha=r.unpackAlpha),"flip"in r&&(this.flip=r.flip),"shadowMap"in r&&(this.shadowMap=r.shadowMap),"anisotropic"in r&&(this.anisotropic=r.anisotropic)):r={},!r.pixelFormat&&r.isFloatingPointTexture&&(this.pixelFormat=e.PFORMATSTR_RGBA32F),this.textureType==e.TYPE_DEPTH&&(this.pixelFormat=e.PFORMATSTR_DEPTH),r.width||(r.width=8),r.height||(r.height=8),this._cgl.profileData.profileTextureNew++,this.setFormat(e.setUpGlPixelFormat(this._cgl,this.pixelFormat)),this._cgl.profileData.addHeavyEvent("texture created",this.name,r.width+"x"+r.height),this.setSize(r.width,r.height),this.getInfoOneLine()};e.prototype.isFloatingPoint=function(){return e.isPixelFormatFloat(this.pixelFormat)},e.prototype.compareSettings=function(t){return!!t&&t.width==this.width&&t.height==this.height&&t.filter==this.filter&&t.wrap==this.wrap&&t.textureType==this.textureType&&t.unpackAlpha==this.unpackAlpha&&t.anisotropic==this.anisotropic&&t.shadowMap==this.shadowMap&&t.texTarget==this.texTarget&&t.flip==this.flip},e.prototype.clone=function(){const t=new e(this._cgl,{name:this.name,filter:this.filter,anisotropic:this.anisotropic,wrap:this.wrap,textureType:this.textureType,pixelFormat:this.pixelFormat,unpackAlpha:this.unpackAlpha,flip:this.flip,width:this.width,height:this.height});return this._cgl.profileData.addHeavyEvent("texture created",this.name,this.width+"x"+this.height),this.compareSettings(t)||(this._log.error("Cloned texture settings do not compare!"),this._log.error(this),this._log.error(t)),t},e.prototype.setFormat=function(t){this.pixelFormat=t.pixelFormat,this._glDataFormat=t.glDataFormat,this._glInternalFormat=t.glInternalFormat,this._glDataType=t.glDataType},e.setUpGlPixelFormat=function(t,i){const r={};i||(console.log("no pixelformatstr!"),console.log((new Error).stack),i=e.PFORMATSTR_RGBA8UB),r.pixelFormatBase=i,t.glUseHalfFloatTex&&(i==e.PFORMATSTR_RGBA32F&&(i=e.PFORMATSTR_RGBA16F),i==e.PFORMATSTR_RG32F&&(i=e.PFORMATSTR_RG16F),i==e.PFORMATSTR_R32F&&(i=e.PFORMATSTR_R16F)),r.pixelFormat=i,r.glDataType=t.gl.UNSIGNED_BYTE,r.glInternalFormat=t.gl.RGBA8,r.glDataFormat=t.gl.RGBA;let l=t.gl.FLOAT;if(1==t.glVersion&&(r.glInternalFormat=t.gl.RGBA,i==e.PFORMATSTR_RGBA16F||i==e.PFORMATSTR_RG16F||i==e.PFORMATSTR_R16F)){const e=t.enableExtension("OES_texture_half_float");if(!e)throw new Error("no half float texture extension");l=e.HALF_FLOAT_OES}return i==e.PFORMATSTR_RGBA8UB||(i==e.PFORMATSTR_RGB565?(r.glInternalFormat=t.gl.RGB565,r.glDataFormat=t.gl.RGB):i==e.PFORMATSTR_R8UB?(r.glInternalFormat=t.gl.R8,r.glDataFormat=t.gl.RED):i==e.PFORMATSTR_RG8UB?(r.glInternalFormat=t.gl.RG8,r.glDataFormat=t.gl.RG):i==e.PFORMATSTR_RGB8UB?(r.glInternalFormat=t.gl.RGB8,r.glDataFormat=t.gl.RGB):i==e.PFORMATSTR_SRGBA8?r.glInternalFormat=t.gl.SRGB8_ALPHA8:i==e.PFORMATSTR_R32F?(r.glInternalFormat=t.gl.R32F,r.glDataFormat=t.gl.RED,r.glDataType=l):i==e.PFORMATSTR_R16F?(r.glInternalFormat=t.gl.R16F,r.glDataType=l,r.glDataFormat=t.gl.RED):i==e.PFORMATSTR_RG16F?(r.glInternalFormat=t.gl.RG16F,r.glDataType=l,r.glDataFormat=t.gl.RG):i==e.PFORMATSTR_RGBA16F?(1==t.glVersion?r.glInternalFormat=t.gl.RGBA:r.glInternalFormat=t.gl.RGBA16F,r.glDataType=l):i==e.PFORMATSTR_R11FG11FB10F?(r.glInternalFormat=t.gl.R11F_G11F_B10F,r.glDataType=l,r.glDataFormat=t.gl.RGB):i==e.PFORMATSTR_RGBA32F?(1==t.glVersion?r.glInternalFormat=t.gl.RGBA:r.glInternalFormat=t.gl.RGBA32F,r.glDataType=l):i==e.PFORMATSTR_DEPTH?1==t.glVersion?(r.glInternalFormat=t.gl.DEPTH_COMPONENT,r.glDataType=t.gl.UNSIGNED_SHORT,r.glDataFormat=t.gl.DEPTH_COMPONENT):(r.glInternalFormat=t.gl.DEPTH_COMPONENT32F,r.glDataType=t.gl.FLOAT,r.glDataFormat=t.gl.DEPTH_COMPONENT):console.log("unknown pixelformat ",i)),(i.contains("32bit")||i==e.PFORMATSTR_R11FG11FB10F)&&(2==t.glVersion&&t.enableExtension("EXT_color_buffer_float"),2==t.glVersion&&t.enableExtension("EXT_float_blend"),t.enableExtension("OES_texture_float_linear")),i.contains("16bit")&&(t.enableExtension("EXT_color_buffer_half_float"),t.enableExtension("OES_texture_float_linear")),r.numColorChannels=1,i.startsWith("R")&&(r.numColorChannels=1),i.startsWith("RG")&&(r.numColorChannels=2),i.startsWith("RGB")&&(r.numColorChannels=3),i.startsWith("RGBA")&&(r.numColorChannels=4),r.glDataType&&r.glInternalFormat&&r.glDataFormat||console.log("pixelformat wrong ?!",i,r.glDataType,r.glInternalFormat,r.glDataFormat,this),r},e.prototype.setSize=function(t,i){this._cgl.aborted||((t!=t||t<=0||!t)&&(t=8),(i!=i||i<=0||!i)&&(i=8),(t>this._cgl.maxTexSize||i>this._cgl.maxTexSize)&&this._log.error("texture size too big! "+t+"x"+i+" / max: "+this._cgl.maxTexSize),t=Math.min(t,this._cgl.maxTexSize),i=Math.min(i,this._cgl.maxTexSize),t=Math.floor(t),i=Math.floor(i),(this.width!=t||this.height!=i)&&(this.width=t,this.height=i,this.deleted=!1,this.setFormat(e.setUpGlPixelFormat(this._cgl,this.pixelFormat)),this.shortInfoString=this.getInfoOneLine(),this._cgl.gl.bindTexture(this.texTarget,this.tex),this._cgl.profileData.profileTextureResize++,this._cgl.gl.texImage2D(this.texTarget,0,this._glInternalFormat,t,i,0,this._glDataFormat,this._glDataType,null),this._setFilter(),this.updateMipMap(),this._cgl.gl.bindTexture(this.texTarget,null)))},e.prototype.initFromData=function(t,i,r,l,s){if(this.filter=l,this.wrap=s,null==l&&(this.filter=e.FILTER_LINEAR),null==s&&(this.wrap=e.WRAP_CLAMP_TO_EDGE),this.width=i,this.height=r,this._fromData=!0,this.deleted=!1,this.height>this._cgl.maxTexSize||this.width>this._cgl.maxTexSize){const t=CGL.Texture.getTempTexture(this._cgl);return this.width=t.width,this.height=t.height,this.tex=t.tex,void this._log.error("[cgl_texture] texture size to big!!!",this.width,this.height,this._cgl.maxTexSize)}this.flip&&this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL,this.flip),this._cgl.gl.bindTexture(this.texTarget,this.tex),this.setFormat(e.setUpGlPixelFormat(this._cgl,this.pixelFormat)),this._cgl.gl.texImage2D(this.texTarget,0,this._glInternalFormat,i,r,0,this._glDataFormat,this._glDataType,t),this._setFilter(),this.updateMipMap(),this.flip&&this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL,!1),this._cgl.gl.bindTexture(this.texTarget,null)},e.prototype.updateMipMap=function(){2!=this._cgl.glVersion&&!this.isPowerOfTwo()||this.filter!=e.FILTER_MIPMAP||(this._cgl.gl.generateMipmap(this.texTarget),this._cgl.profileData.profileGenMipMap++)},e.prototype.initTexture=function(t,i){if(this._cgl.printError("before initTexture"),this._cgl.checkFrameStarted("texture inittexture"),this._fromData=!1,this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.unpackAlpha),t.width&&(this.width=t.width),t.height&&(this.height=t.height),void 0!==i&&(this.filter=i),t.height>this._cgl.maxTexSize||t.width>this._cgl.maxTexSize){const e=CGL.Texture.getTempTexture(this._cgl);return this.width=e.width,this.height=e.height,this.tex=e.tex,void this._log.error("[cgl_texture] texture size to big!!!",t.width,t.height,this._cgl.maxTexSize)}this._cgl.gl.bindTexture(this.texTarget,this.tex),this.deleted=!1,this.flipped=!this.flip,this.flipped&&this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL,this.flipped),this.setFormat(e.setUpGlPixelFormat(this._cgl,this.pixelFormat)),this._cgl.gl.texImage2D(this.texTarget,0,this._glInternalFormat,this._glDataFormat,this._glDataType,t),this._setFilter(),this.updateMipMap(),this._cgl.gl.bindTexture(this.texTarget,null),this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),this.flipped&&this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL,!1),this.getInfoOneLine(),this._cgl.printError("initTexture")},e.prototype.dispose=e.prototype.delete=function(){this.loading||(this.deleted=!0,this.width=0,this.height=0,this._cgl.profileData.profileTextureDelete++,this._cgl.gl.deleteTexture(this.tex),this.image=null,this.tex=null)},e.prototype.isPowerOfTwo=function(){return e.isPowerOfTwo(this.width)&&e.isPowerOfTwo(this.height)},e.prototype.printInfo=function(){console.log(this.getInfo())},e.prototype.getInfoReadable=function(){const t=this.getInfo();let e="";t.name=t.name.substr(0,t.name.indexOf("?rnd="));for(const i in t)e+="* "+i+":  **"+t[i]+"**\n";return e},e.prototype.getInfoOneLine=function(){let t=this.width+"x"+this.height;return t+=" ",t+=this.pixelFormat,this.filter===CGL.Texture.FILTER_NEAREST&&(t+=" nearest"),this.filter===CGL.Texture.FILTER_LINEAR&&(t+=" linear"),this.filter===CGL.Texture.FILTER_MIPMAP&&(t+=" mipmap"),this.wrap===CGL.Texture.WRAP_CLAMP_TO_EDGE&&(t+=" clamp"),this.wrap===CGL.Texture.WRAP_REPEAT&&(t+=" repeat"),this.wrap===CGL.Texture.WRAP_MIRRORED_REPEAT&&(t+=" repeatmir"),this.shortInfoString=t,t},e.prototype.getInfoOneLineShort=function(){let t=this.width+"x"+this.height;return t+=" ",t+=this.pixelFormat,this.shortInfoString=t,t},e.prototype.getInfo=function(){return e.getTexInfo(this)},e.prototype._setFilter=function(){if(this._cgl.printError("before _setFilter"),this._fromData||this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.unpackAlpha),this.shadowMap&&(this._cgl.gl.texParameteri(this._cgl.gl.TEXTURE_2D,this._cgl.gl.TEXTURE_COMPARE_MODE,this._cgl.gl.COMPARE_REF_TO_TEXTURE),this._cgl.gl.texParameteri(this._cgl.gl.TEXTURE_2D,this._cgl.gl.TEXTURE_COMPARE_FUNC,this._cgl.gl.LEQUAL)),this.textureType==e.TYPE_FLOAT&&this.filter==e.FILTER_MIPMAP&&(this.filter=e.FILTER_LINEAR,this._log.stack("texture: HDR and mipmap filtering at the same time is not possible")),1!=this._cgl.glVersion||this.isPowerOfTwo()){if(this.wrap==e.WRAP_CLAMP_TO_EDGE?(this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.CLAMP_TO_EDGE),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.CLAMP_TO_EDGE)):this.wrap==e.WRAP_REPEAT?(this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.REPEAT),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.REPEAT)):this.wrap==e.WRAP_MIRRORED_REPEAT&&(this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.MIRRORED_REPEAT),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.MIRRORED_REPEAT)),this.filter==e.FILTER_NEAREST)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.NEAREST);else if(this.filter==e.FILTER_LINEAR)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.LINEAR),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.LINEAR);else{if(this.filter!=e.FILTER_MIPMAP)throw this._log.log("unknown texture filter!",this.filter),new Error("unknown texture filter!"+this.filter);this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.LINEAR),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.LINEAR_MIPMAP_LINEAR)}if(this.anisotropic){const t=this._cgl.enableExtension("EXT_texture_filter_anisotropic");if(this._cgl.maxAnisotropic){const e=Math.min(this._cgl.maxAnisotropic,this.anisotropic);this._cgl.gl.texParameterf(this._cgl.gl.TEXTURE_2D,t.TEXTURE_MAX_ANISOTROPY_EXT,e)}}}else this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.CLAMP_TO_EDGE),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.CLAMP_TO_EDGE),this.filter=e.FILTER_NEAREST,this.wrap=e.WRAP_CLAMP_TO_EDGE;this.getInfoOneLine(),this._cgl.printError("_setFilter")},e.load=function(t,i,r,l){if(!i)return r({error:!0});let s=null;t.patch.loading.existByName(i)||(s=t.patch.loading.start("texture",i));const a=new e(t);return a.name=i,t.patch.isEditorMode()&&gui.jobs().start({id:"loadtexture"+s,title:"loading texture "+CABLES.basename(i)}),a.image=new Image,a.image.crossOrigin="anonymous",a.loading=!0,l&&l.hasOwnProperty("filter")&&(a.filter=l.filter),l&&l.hasOwnProperty("flip")&&(a.flip=l.flip),l&&l.hasOwnProperty("wrap")&&(a.wrap=l.wrap),l&&l.hasOwnProperty("anisotropic")&&(a.anisotropic=l.anisotropic),l&&l.hasOwnProperty("unpackAlpha")&&(a.unpackAlpha=l.unpackAlpha),l&&l.hasOwnProperty("pixelFormat")&&(a.pixelFormat=l.pixelFormat),a.image.onabort=a.image.onerror=e=>{console.warn("[cgl.texture.load] error loading texture",i,e),a.loading=!1,s&&t.patch.loading.finished(s),r&&r({error:!0},a),t.patch.isEditorMode()&&gui.jobs().finish("loadtexture"+s)},a.image.onload=function(e){t.addNextFrameOnceCallback((()=>{a.initTexture(a.image),s&&t.patch.loading.finished(s),a.loading=!1,t.patch.isEditorMode()&&gui.jobs().finish("loadtexture"+s),r&&r(null,a)}))},a.image.src=i,a},e.getTempTexture=function(t){return t||console.error("[getTempTexture] no cgl!"),t.tempTexture||(t.tempTexture=e.getTemporaryTexture(t,256,e.FILTER_LINEAR,e.REPEAT)),t.tempTexture},e.getErrorTexture=function(t){return t||console.error("[getTempTexture] no cgl!"),t.errorTexture||(t.errorTexture=e.getTemporaryTexture(t,256,e.FILTER_LINEAR,e.REPEAT,1,.2,.2)),t.errorTexture},e.getEmptyTexture=function(t,i){if(i)return e.getEmptyTextureFloat(t);if(t||console.error("[getEmptyTexture] no cgl!"),t.tempTextureEmpty)return t.tempTextureEmpty;t.tempTextureEmpty=new e(t,{name:"emptyTexture"});const r=new Uint8Array(256).fill(0);for(let t=0;t<256;t+=4)r[t+3]=0;return t.tempTextureEmpty.initFromData(r,8,8,e.FILTER_NEAREST,e.WRAP_REPEAT),t.tempTextureEmpty},e.getEmptyTextureFloat=function(t){if(t||console.error("[getEmptyTextureFloat] no cgl!"),t.tempTextureEmptyFloat)return t.tempTextureEmptyFloat;t.tempTextureEmptyFloat=new e(t,{name:"emptyTexture",isFloatingPointTexture:!0});const i=new Float32Array(256).fill(1);for(let t=0;t<256;t+=4)i[t+3]=0;return t.tempTextureEmptyFloat.initFromData(i,8,8,e.FILTER_NEAREST,e.WRAP_REPEAT),t.tempTextureEmptyFloat},e.getRandomTexture=function(t){if(t||console.error("[getRandomTexture] no cgl!"),t.randomTexture)return t.randomTexture;const i=new Uint8Array(262144);for(let t=0;t<65536;t++)i[4*t+0]=255*Math.random(),i[4*t+1]=255*Math.random(),i[4*t+2]=255*Math.random(),i[4*t+3]=255;return t.randomTexture=new e(t),t.randomTexture.initFromData(i,256,256,e.FILTER_NEAREST,e.WRAP_REPEAT),t.randomTexture},e.getRandomFloatTexture=function(t){if(t||console.error("[getRandomTexture] no cgl!"),t.getRandomFloatTexture)return t.getRandomFloatTexture;const i=new Float32Array(262144);for(let t=0;t<65536;t++)i[4*t+0]=2*(Math.random()-.5),i[4*t+1]=2*(Math.random()-.5),i[4*t+2]=2*(Math.random()-.5),i[4*t+3]=1;return t.getRandomFloatTexture=new e(t,{isFloatingPointTexture:!0}),t.getRandomFloatTexture.initFromData(i,256,256,e.FILTER_NEAREST,e.WRAP_REPEAT),t.getRandomFloatTexture},e.getBlackTexture=function(t){if(t||this._log.error("[getBlackTexture] no cgl!"),t.blackTexture)return t.blackTexture;const i=new Uint8Array(256);for(let t=0;t<64;t++)i[4*t+0]=i[4*t+1]=i[4*t+2]=0,i[4*t+3]=255;return t.blackTexture=new e(t),t.blackTexture.initFromData(i,8,8,e.FILTER_NEAREST,e.WRAP_REPEAT),t.blackTexture},e.getEmptyCubemapTexture=function(t){const i=[t.gl.TEXTURE_CUBE_MAP_POSITIVE_X,t.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,t.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,t.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,t.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,t.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],r=t.gl.createTexture(),l=t.gl.TEXTURE_CUBE_MAP,s=e.FILTER_NEAREST,a=e.WRAP_CLAMP_TO_EDGE;t.profileData.profileTextureNew++,t.gl.bindTexture(l,r),t.profileData.profileTextureResize++;for(let e=0;e<6;e+=1){const r=new Uint8Array(256);t.gl.texImage2D(i[e],0,t.gl.RGBA,8,8,0,t.gl.RGBA,t.gl.UNSIGNED_BYTE,r),t.gl.texParameteri(l,t.gl.TEXTURE_MAG_FILTER,t.gl.NEAREST),t.gl.texParameteri(l,t.gl.TEXTURE_MIN_FILTER,t.gl.NEAREST),t.gl.texParameteri(l,t.gl.TEXTURE_WRAP_S,t.gl.CLAMP_TO_EDGE),t.gl.texParameteri(l,t.gl.TEXTURE_WRAP_T,t.gl.CLAMP_TO_EDGE)}return t.gl.bindTexture(l,null),{id:CABLES.uuid(),tex:r,cubemap:r,width:8,height:8,filter:s,wrap:a,unpackAlpha:!0,flip:!0,_fromData:!0,name:"emptyCubemapTexture",anisotropic:0}},e.getTempGradientTexture=function(t){if(t||console.error("[getTempGradientTexture] no cgl!"),t.tempTextureGradient)return t.tempTextureGradient;const i=new e(t),r=256,l=new Uint8Array(262144);for(let t=0;t<r;t++)for(let e=0;e<r;e++)l[4*(e+t*r)+0]=l[4*(e+t*r)+1]=l[4*(e+t*r)+2]=255-t,l[4*(e+t*r)+3]=255;return i.initFromData(l,r,r,e.FILTER_NEAREST,e.WRAP_REPEAT),t.tempTextureGradient=i,i},e.getTemporaryTexture=function(t,i,r,l,s,a,h){void 0===s&&(s=1),void 0===a&&(a=1),void 0===h&&(h=1);const g=new e(t),o=[];for(let t=0;t<i;t++)for(let e=0;e<i;e++)(e+t)%64<32?(o.push((200+t/i*25+e/i*25)*s),o.push((200+t/i*25+e/i*25)*a),o.push((200+t/i*25+e/i*25)*h)):(o.push((40+t/i*25+e/i*25)*s),o.push((40+t/i*25+e/i*25)*a),o.push((40+t/i*25+e/i*25)*h)),o.push(255);const _=new Uint8Array(o);return g.initFromData(_,i,i,r,l),g},e.createFromImage=function(t,i,r){const l=new e(t,r=r||{});return l.flip=!1,l.image=i,l.width=i.width,l.height=i.height,r.hasOwnProperty("wrap")&&(l.wrap=r.wrap),console.log("createFromImage",r),l.initTexture(i,r.filter),l},e.fromImage=function(t,i,r,l){console.error("deprecated texture from image...");const s=new e(t);return s.flip=!1,r&&(s.filter=r),l&&(s.wrap=l),s.image=i,s.initTexture(i),s},e.isPowerOfTwo=function(t){return 1==t||2==t||4==t||8==t||16==t||32==t||64==t||128==t||256==t||512==t||1024==t||2048==t||4096==t||8192==t||16384==t},e.getTexInfo=function(t){const i={};i.name=t.name,i["power of two"]=t.isPowerOfTwo(),i.size=t.width+" x "+t.height;let r=t.texTarget;return t.texTarget==t._cgl.gl.TEXTURE_2D&&(r="TEXTURE_2D"),i.target=r,i.unpackAlpha=t.unpackAlpha,t.cubemap&&(i.cubemap=!0),t.textureType==e.TYPE_FLOAT&&(i.textureType="TYPE_FLOAT"),t.textureType==e.TYPE_HALF_FLOAT?i.textureType="TYPE_HALF_FLOAT":t.textureType==e.TYPE_DEPTH?i.textureType="TYPE_DEPTH":t.textureType==e.TYPE_DEFAULT?i.textureType="TYPE_DEFAULT":i.textureType="UNKNOWN "+this.textureType,t.wrap==e.WRAP_CLAMP_TO_EDGE?i.wrap="CLAMP_TO_EDGE":t.wrap==e.WRAP_REPEAT?i.wrap="WRAP_REPEAT":t.wrap==e.WRAP_MIRRORED_REPEAT?i.wrap="WRAP_MIRRORED_REPEAT":i.wrap="UNKNOWN",t.filter==e.FILTER_NEAREST?i.filter="FILTER_NEAREST":t.filter==e.FILTER_LINEAR?i.filter="FILTER_LINEAR":t.filter==e.FILTER_MIPMAP?i.filter="FILTER_MIPMAP":i.filter="UNKNOWN",i.pixelFormat=t.pixelFormat||"unknown",i},e.FILTER_NEAREST=0,e.FILTER_LINEAR=1,e.FILTER_MIPMAP=2,e.WRAP_REPEAT=0,e.WRAP_MIRRORED_REPEAT=1,e.WRAP_CLAMP_TO_EDGE=2,e.TYPE_DEFAULT=0,e.TYPE_DEPTH=1,e.TYPE_FLOAT=2,e.PFORMATSTR_RGB565="RGB 5/6/5bit ubyte",e.PFORMATSTR_R8UB="R 8bit ubyte",e.PFORMATSTR_RG8UB="RG 8bit ubyte",e.PFORMATSTR_RGB8UB="RGB 8bit ubyte",e.PFORMATSTR_RGBA8UB="RGBA 8bit ubyte",e.PFORMATSTR_SRGBA8="SRGBA 8bit ubyte",e.PFORMATSTR_R11FG11FB10F="RGB 11/11/10bit float",e.PFORMATSTR_R16F="R 16bit float",e.PFORMATSTR_RG16F="RG 16bit float",e.PFORMATSTR_RGB16F="RGB 16bit float",e.PFORMATSTR_RGBA16F="RGBA 16bit float",e.PFORMATSTR_R32F="R 32bit float",e.PFORMATSTR_RGBA32F="RGBA 32bit float",e.PFORMATSTR_DEPTH="DEPTH",e.PIXELFORMATS=[e.PFORMATSTR_RGB565,e.PFORMATSTR_R8UB,e.PFORMATSTR_RG8UB,e.PFORMATSTR_RGB8UB,e.PFORMATSTR_RGBA8UB,e.PFORMATSTR_SRGBA8,e.PFORMATSTR_R11FG11FB10F,e.PFORMATSTR_R16F,e.PFORMATSTR_RG16F,e.PFORMATSTR_RGBA16F,e.PFORMATSTR_R32F,e.PFORMATSTR_RGBA32F],e.isPixelFormatFloat=t=>(t||"").contains("float"),e.isPixelFormatHalfFloat=t=>(t||"").contains("float")&&(t||"").contains("16bit");class i{constructor(t,i){this.id=CABLES.uuid(),this.name=i.name||"unknown cubemap texture",this._cgl=t,this.textureType=e.TYPE_DEFAULT,this._options=i,this._cubemapFaces=[this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_X,this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],this.cubemap=this.tex=this._cgl.gl.createTexture(),this.texTarget=this._cgl.gl.TEXTURE_CUBE_MAP,this.width=8,this.height=8,this.filter=i.filter||CGL.Texture.FILTER_NEAREST,this.wrap=i.wrap||CGL.Texture.WRAP_CLAMP_TO_EDGE,this.unpackAlpha=i.unpackAlpha||!0,this.flip=i.flip||!0,i.hasOwnProperty("pixelFormat")&&i.pixelFormat||(i.isFloatingPointTexture?i.pixelFormat=e.PFORMATSTR_RGBA32F:i.pixelFormat=e.PFORMATSTR_RGBA8UB),this.pixelFormat=i.pixelFormat,this._cgl.profileData.profileTextureNew++,this.setSize(i.width,i.height)}getInfo(){return{pixelFormat:this.pixelFormat}}setSize(t,i){this.delete(),this.cubemap=this.tex=this._cgl.gl.createTexture(),this._cgl.checkFrameStarted("cubemap corelib setsize"),(t!=t||t<=0||!t)&&(t=8),(i!=i||i<=0||!i)&&(i=8),(t>this._cgl.maxTexSize||i>this._cgl.maxTexSize)&&console.error("texture size too big! "+t+"x"+i+" / max: "+this._cgl.maxTexSize),t=Math.min(t,this._cgl.maxTexSize),i=Math.min(i,this._cgl.maxTexSize),t=Math.floor(t),i=Math.floor(i),this.width=t,this.height=i,this._cgl.gl.bindTexture(this.texTarget,this.tex),this._cgl.profileData.profileTextureResize++;const r=e.setUpGlPixelFormat(this._cgl,this._options.pixelFormat);this.pixelFormat=r.pixelFormat,CGL.Texture.isPixelFormatHalfFloat(r.pixelFormat)?(this._cgl.enableExtension("EXT_color_buffer_half_float"),this._cgl.enableExtension("OES_texture_float_linear")||(this.filter=e.FILTER_NEAREST)):CGL.Texture.isPixelFormatFloat(r.pixelFormat)&&(this._cgl.enableExtension("OES_texture_float_linear")||(console.log("no linear pixelformat,using nearest"),this.filter=e.FILTER_NEAREST));for(let t=0;t<6;t++)this._cgl.gl.texImage2D(this._cubemapFaces[t],0,r.glInternalFormat,this.width,this.height,0,r.glDataFormat,r.glDataType,null);this._setFilter(),this.updateMipMap(),this._cgl.gl.bindTexture(this.texTarget,null)}_setFilter(){if(this._cgl.checkFrameStarted("cubemap corelib"),this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.unpackAlpha),CGL.Texture.isPixelFormatFloat(this.pixelFormat)&&this.filter==CGL.Texture.FILTER_MIPMAP&&(console.log("texture: HDR and mipmap filtering at the same time is not possible"),this.filter=CGL.Texture.FILTER_LINEAR),1!=this._cgl.glVersion||e.isPowerOfTwo()){if(this.wrap==CGL.Texture.WRAP_CLAMP_TO_EDGE)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.CLAMP_TO_EDGE),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.CLAMP_TO_EDGE);else if(this.wrap==CGL.Texture.WRAP_REPEAT)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.REPEAT),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.REPEAT);else{if(this.wrap!=CGL.Texture.WRAP_MIRRORED_REPEAT)throw new Error("[CubemapTexture] unknown texture filter!"+this.filter);this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.MIRRORED_REPEAT),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.MIRRORED_REPEAT)}if(this.filter==CGL.Texture.FILTER_NEAREST)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.NEAREST);else if(this.filter==CGL.Texture.FILTER_LINEAR)this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.LINEAR),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.LINEAR);else{if(this.filter!=CGL.Texture.FILTER_MIPMAP)throw new Error("[CubemapTexture] unknown texture filter!"+this.filter);this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.LINEAR),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.LINEAR_MIPMAP_LINEAR)}}else this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MAG_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_MIN_FILTER,this._cgl.gl.NEAREST),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_S,this._cgl.gl.CLAMP_TO_EDGE),this._cgl.gl.texParameteri(this.texTarget,this._cgl.gl.TEXTURE_WRAP_T,this._cgl.gl.CLAMP_TO_EDGE),this.filter=CGL.Texture.FILTER_NEAREST,this.wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE}updateMipMap(){this.filter==CGL.Texture.FILTER_MIPMAP&&(this._cgl.gl.bindTexture(this.texTarget,this.tex),this._cgl.gl.generateMipmap(this.texTarget),this._cgl.profileData.profileGenMipMap++)}delete(){this._cgl.gl.deleteTexture(this.tex)}}CGL.CubemapFramebuffer=class{constructor(t,e,r,l){this._cgl=t,this.width=e||8,this.height=r||8,this._cubemapProperties=[{face:this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_X,lookAt:vec3.fromValues(1,0,0),up:vec3.fromValues(0,-1,0)},{face:this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,lookAt:vec3.fromValues(-1,0,0),up:vec3.fromValues(0,-1,0)},{face:this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,lookAt:vec3.fromValues(0,1,0),up:vec3.fromValues(0,0,1)},{face:this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,lookAt:vec3.fromValues(0,-1,0),up:vec3.fromValues(0,0,-1)},{face:this._cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,lookAt:vec3.fromValues(0,0,1),up:vec3.fromValues(0,-1,0)},{face:this._cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,lookAt:vec3.fromValues(0,0,-1),up:vec3.fromValues(0,-1,0)}],this._lookAtTemp=vec3.fromValues(0,0,0),this.camPos=vec3.fromValues(0,0,0),this._modelMatrix=mat4.create(),this._viewMatrix=mat4.create(),this._projectionMatrix=mat4.perspective(mat4.create(),90*CGL.DEG2RAD,1,.1,1e3),this._depthRenderbuffer=null,this._framebuffer=null,this._depthbuffer=null,this._textureDepth=null,this._options=l||{},this.name=this._options.name||"unknown cubemapframebuffer",this._options.hasOwnProperty("numRenderBuffers")||(this._options.numRenderBuffers=1),this._options.hasOwnProperty("depth")||(this._options.depth=!0),this._options.hasOwnProperty("clear")||(this._options.clear=!0),this._options.hasOwnProperty("multisampling")||(this._options.multisampling=!1,this._options.multisamplingSamples=0),this._options.multisamplingSamples&&(this._cgl.glSlowRenderer&&(this._options.multisamplingSamples=0),this._cgl.gl.MAX_SAMPLES?this._options.multisamplingSamples=Math.min(this._cgl.gl.getParameter(this._cgl.gl.MAX_SAMPLES),this._options.multisamplingSamples):this._options.multisamplingSamples=0),this._options.hasOwnProperty("filter")||(this._options.filter=CGL.Texture.FILTER_LINEAR),this._options.hasOwnProperty("wrap")||(this._options.wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE),this._cgl.checkFrameStarted("cubemap framebuffer");let s=l.pixeFormat;!s&&l.isFloatingPointTexture&&(s=CGL.Texture.PFORMATSTR_RGBA32F),this.texture=new i(this._cgl,{width:this.width,height:this.height,pixelFormat:l.pixelFormat,filter:this._options.filter,wrap:this._options.wrap,name:this.name+" cubemaptexture"}),this.initializeRenderbuffers(),this.setSize(this.width,this.height)}initializeRenderbuffers(){this._framebuffer=this._cgl.gl.createFramebuffer(),this._depthbuffer=this._cgl.gl.createRenderbuffer(),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,this._framebuffer),this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.DEPTH_COMPONENT16,this.width,this.height),this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER,this._cgl.gl.DEPTH_ATTACHMENT,this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER,null),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,null)}getWidth(){return this.width}getHeight(){return this.height}getGlFrameBuffer(){return this._framebuffer}getDepthRenderBuffer(){return this._depthRenderbuffer}getTextureColor(){return this.texture}getTextureDepth(){return this._textureDepth}dispose(){this.texture&&(this.texture=this.texture.delete()),this._framebuffer&&this._cgl.gl.deleteFramebuffer(this._framebuffer),this._depthRenderbuffer&&this._cgl.gl.deleteRenderbuffer(this._depthbuffer)}delete(){this.dispose()}setSize(t,e){this._cgl.printError("before cubemap setsize"),this.width=Math.floor(t),this.height=Math.floor(e),this.width=Math.min(this.width,this._cgl.maxTexSize),this.height=Math.min(this.height,this._cgl.maxTexSize),this._cgl.profileData.profileFrameBuffercreate++,this._framebuffer=this._cgl.gl.createFramebuffer(),this._depthbuffer=this._cgl.gl.createRenderbuffer(),this.texture.setSize(this.width,this.height),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,this._framebuffer),this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.DEPTH_COMPONENT16,this.width,this.height),this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER,this._cgl.gl.DEPTH_ATTACHMENT,this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._cgl.gl.isFramebuffer(this._framebuffer)||console.error("invalid framebuffer...");const i=this._cgl.gl.checkFramebufferStatus(this._cgl.gl.FRAMEBUFFER);this.checkErrorsByStatus(i),this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_CUBE_MAP,null),this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER,null),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,null),this._cgl.printError("cubemap setsize")}checkErrorsByStatus(t){switch(t){case this._cgl.gl.FRAMEBUFFER_COMPLETE:break;case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:throw console.error("FRAMEBUFFER_INCOMPLETE_ATTACHMENT...",this.width,this.height,this.texture.tex,this._depthBuffer),new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:throw console.error("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT"),new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:throw console.error("FRAMEBUFFER_INCOMPLETE_DIMENSIONS"),new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");case this._cgl.gl.FRAMEBUFFER_UNSUPPORTED:throw console.error("FRAMEBUFFER_UNSUPPORTED"),new Error("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");case 36059:console.error("Incomplete: FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER from ext. Or Safari/iOS undefined behaviour.");break;default:throw console.error("incomplete framebuffer",t),console.log(this),new Error("Incomplete framebuffer: "+t)}}setFilter(t){this.texture.filter=t,this.texture.setSize(this.width,this.height)}setCamPos(t){this.camPos=t||this.camPos}setMatrices(t,e,i){this._modelMatrix=t||this._modelMatrix,this._viewMatrix=e||this._viewMatrix,this._projectionMatrix=i||this._projectionMatrix}renderStart(){this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_CUBE_MAP,this.texture.tex),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,this._framebuffer),this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._cgl.gl.viewport(0,0,this.width,this.height),this._cgl.pushGlFrameBuffer(this._framebuffer),this._cgl.pushFrameBuffer(this)}renderStartCubemapFace(t){this._cgl.pushModelMatrix(),this._cgl.pushViewMatrix(),this._cgl.pushPMatrix(),this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER,this._cgl.gl.COLOR_ATTACHMENT0,this._cubemapProperties[t].face,this.texture.tex,0),this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER,this._cgl.gl.DEPTH_ATTACHMENT,this._cgl.gl.RENDERBUFFER,this._depthbuffer),this._options.clear&&(this._cgl.gl.clearColor(0,0,0,1),this._cgl.gl.clear(this._cgl.gl.COLOR_BUFFER_BIT|this._cgl.gl.DEPTH_BUFFER_BIT)),this.setMatricesCubemapFace(t)}setMatricesCubemapFace(t){mat4.copy(this._cgl.mMatrix,this._modelMatrix),vec3.add(this._lookAtTemp,this.camPos,this._cubemapProperties[t].lookAt),mat4.lookAt(this._cgl.vMatrix,this.camPos,this._lookAtTemp,this._cubemapProperties[t].up),mat4.copy(this._cgl.pMatrix,this._projectionMatrix)}renderEndCubemapFace(){this._cgl.popPMatrix(),this._cgl.popModelMatrix(),this._cgl.popViewMatrix()}renderEnd(){this._cgl.profileData.profileFramebuffer++,1!==this._cgl.glVersion&&this._cgl.gl.bindFramebuffer(this._cgl.gl.READ_FRAMEBUFFER,this._framebuffer),this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER,this._cgl.popGlFrameBuffer()),this._cgl.popFrameBuffer(),this._cgl.resetViewPort(),this.updateMipMap()}updateMipMap(){this.texture&&(this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_CUBE_MAP,this.texture.tex),this.texture.updateMipMap(),this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_CUBE_MAP,null))}},((this.CGL=this.CGL||{}).COREMODULES=this.CGL.COREMODULES||{}).Cubemapframebuffer={}.Cubemapframebuffer})();