"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Ui=Ops.Ui || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.Number=Ops.Number || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.Trigger=Ops.Trigger || {};
Ops.Gl.Phong=Ops.Gl.Phong || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.ImageCompose=Ops.Gl.ImageCompose || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Gl.ImageCompose.Noise=Ops.Gl.ImageCompose.Noise || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    fpsLimit = op.inValue("FPS Limit", 0),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", true),
    reduceLoadingFPS = op.inValueBool("Reduce FPS loading"),
    clear = op.inValueBool("Clear", true),
    clearAlpha = op.inValueBool("ClearAlpha", true),
    fullscreen = op.inValueBool("Fullscreen Button", false),
    active = op.inValueBool("Active", true),
    hdpi = op.inValueBool("Hires Displays", false),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display");

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;
let timeOutTest = null;
let addedListener = false;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;

let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });
testMultiMainloop();

cgl.mainloopOp = this;

inUnit.onChange = () =>
{
    width.set(0);
    height.set(0);
};

function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.cycleFullscreen();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    if (hdpi.get())op.patch.cgl.pixelDensity = window.devicePixelRatio;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        let div = 1;
        if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;

        width.set(cgl.canvasWidth / div);
        height.set(cgl.canvasHeight / div);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    op.patch.cgl.profileData.profileMainloopMs = performance.now() - startTime;
}

function testMultiMainloop()
{
    clearTimeout(timeOutTest);
    timeOutTest = setTimeout(
        () =>
        {
            if (op.patch.getOpsByObjName(op.name).length > 1)
            {
                op.setUiError("multimainloop", "there should only be one mainloop op!");
                if (!addedListener)addedListener = op.patch.addEventListener("onOpDelete", testMultiMainloop);
            }
            else op.setUiError("multimainloop", null, 1);
        }, 500);
}


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Trigger.Sequence
// 
// **************************************************************

Ops.Trigger.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    cleanup = op.inTriggerButton("Clean up connections");

const
    exes = [],
    triggers = [],
    num = 16;

let
    updateTimeout = null,
    connectedOuts = [];

exe.onTriggered = triggerAll;
cleanup.onTriggered = clean;
cleanup.setUiAttribs({ "hideParam": true, "hidePort": true });

for (let i = 0; i < num; i++)
{
    const p = op.outTrigger("trigger " + i);
    triggers.push(p);
    p.onLinkChanged = updateButton;

    if (i < num - 1)
    {
        let newExe = op.inTrigger("exe " + i);
        newExe.onTriggered = triggerAll;
        exes.push(newExe);
    }
}

updateConnected();

function updateConnected()
{
    connectedOuts.length = 0;
    for (let i = 0; i < triggers.length; i++)
        if (triggers[i].links.length > 0) connectedOuts.push(triggers[i]);
}

function updateButton()
{
    updateConnected();
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() =>
    {
        let show = false;
        for (let i = 0; i < triggers.length; i++)
            if (triggers[i].links.length > 1) show = true;

        cleanup.setUiAttribs({ "hideParam": !show });

        if (op.isCurrentUiOp()) op.refreshParams();
    }, 60);
}

function triggerAll()
{
    // for (let i = 0; i < triggers.length; i++) triggers[i].trigger();
    for (let i = 0; i < connectedOuts.length; i++) connectedOuts[i].trigger();
}

function clean()
{
    let count = 0;
    for (let i = 0; i < triggers.length; i++)
    {
        let removeLinks = [];

        if (triggers[i].links.length > 1)
            for (let j = 1; j < triggers[i].links.length; j++)
            {
                while (triggers[count].links.length > 0) count++;

                removeLinks.push(triggers[i].links[j]);
                const otherPort = triggers[i].links[j].getOtherPort(triggers[i]);
                op.patch.link(op, "trigger " + count, otherPort.op, otherPort.name);
                count++;
            }

        for (let j = 0; j < removeLinks.length; j++) removeLinks[j].remove();
    }
    updateButton();
    updateConnected();
}


};

Ops.Trigger.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Trigger.Sequence,objName:"Ops.Trigger.Sequence"};




// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    r = op.inFloatSlider("r", 0.1),
    g = op.inFloatSlider("g", 0.1),
    b = op.inFloatSlider("b", 0.1),
    a = op.inFloatSlider("a", 1);

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;

render.onTriggered = function ()
{
    cgl.gl.clearColor(r.get(), g.get(), b.get(), a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};


};

Ops.Gl.ClearColor.prototype = new CABLES.Op();
CABLES.OPS["19b441eb-9f63-4f35-ba08-b87841517c4d"]={f:Ops.Gl.ClearColor,objName:"Ops.Gl.ClearColor"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v3
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 0.5),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry", null, "geometry"),
    UP = vec3.fromValues(0, 1, 0),
    RIGHT = vec3.fromValues(1, 0, 0);

let
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    lastRadius = 0.0,
    doScale = true,
    vScale = vec3.create(),
    mesh = null;
updateScale();
op.onDelete = function () { if (mesh)mesh.dispose(); };

inTrigger.onTriggered = function ()
{
    if (needsRebuild) buildMesh();

    if (doScale)
    {
        cgl.pushModelMatrix();
        mat4.scale(cgl.mMatrix, cgl.mMatrix, vScale);
    }

    if (inDraw.get()) mesh.render(cgl.getShader());

    if (doScale)
    {
        cgl.popModelMatrix();
    }

    outTrigger.trigger();
};

inStacks.onChange =
    inSlices.onChange =
    inStacklimit.onChange =
        () =>
        {
            needsRebuild = true;
        };

outGeometry.onLinkChanged =
    inRadius.onChange =
        () =>
        {
            if (outGeometry.isLinked()) doScale = false;
            else doScale = true;

            if (doScale) updateScale();
            else needsRebuild = true;
        };

function updateScale()
{
    if (doScale && lastRadius != 1.0)needsRebuild = true;
    vec3.set(vScale, inRadius.get(), inRadius.get(), inRadius.get());
}

function buildMesh()
{
    const
        stacks = Math.ceil(Math.max(inStacks.get(), 2)),
        slices = Math.ceil(Math.max(inSlices.get(), 3)),
        stackLimit = Math.min(Math.max(inStacklimit.get() * stacks, 1), stacks);
    let radius = inRadius.get();

    if (doScale)radius = 1.0;
    lastRadius = radius;
    let
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x, y, z, d, t, a,
        o, u, v, i, j;
    for (i = o = 0; i < stacks + 1; i++)
    {
        v = (i / stacks - 0.5) * Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        // for (j = 0; j < slices+1; j++) {
        for (j = slices; j >= 0; j--)
        {
            u = (j / slices) * TAU;
            x = Math.cos(u) * a;
            z = Math.sin(u) * a;

            positions.push(x * radius, y * radius, z * radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j / slices, i / (stacks + 1));

            d = Math.sqrt(x * x + y * y + z * z);
            normals.push(
                tmpNormal[0] = x / d,
                tmpNormal[1] = y / d,
                tmpNormal[2] = z / d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec, tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for (j = 0; j < slices; j++, o++)
        {
            indices.push(
                o, o + 1, o + slices + 1, o + 1, o + slices + 2, o + slices + 1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.setRef(geom);

    // if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    if (!mesh) mesh = op.patch.cg.createMesh(geom, { "opId": op.id });
    else mesh.setGeom(geom);

    needsRebuild = false;
}


};

Ops.Gl.Meshes.Sphere_v3.prototype = new CABLES.Op();
CABLES.OPS["6ee346d0-614e-4709-91a5-dc21ae975caf"]={f:Ops.Gl.Meshes.Sphere_v3,objName:"Ops.Gl.Meshes.Sphere_v3"};




// **************************************************************
// 
// Ops.Gl.Phong.PhongMaterial_v6
// 
// **************************************************************

Ops.Gl.Phong.PhongMaterial_v6 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"phong_frag":"IN vec3 viewDirection;\nIN vec3 normInterpolated;\nIN vec2 texCoord;\n\n#ifdef AO_CHAN_1\n    #ifndef ATTRIB_texCoord1\n        #define ATTRIB_texCoord1\n\n        IN vec2 texCoord1;\n    #endif\n#endif\n\n#ifdef HAS_TEXTURE_AO\nvec2 tcAo;\n#endif\n\n\n\n#ifdef ENABLE_FRESNEL\n    IN vec4 cameraSpace_pos;\n#endif\n\n// IN mat3 normalMatrix; // when instancing...\n\n#ifdef HAS_TEXTURE_NORMAL\n    IN mat3 TBN_Matrix; // tangent bitangent normal space transform matrix\n#endif\n\nIN vec3 fragPos;\nIN vec3 v_viewDirection;\n\nUNI vec4 inDiffuseColor;\nUNI vec4 inMaterialProperties;\n\n#ifdef ADD_EMISSIVE_COLOR\n    UNI vec4 inEmissiveColor; // .w = intensity\n#endif\n\n#ifdef ENABLE_FRESNEL\n    UNI mat4 viewMatrix;\n    UNI vec4 inFresnel;\n    UNI vec2 inFresnelWidthExponent;\n#endif\n\n#ifdef ENVMAP_MATCAP\n    IN vec3 viewSpaceNormal;\n    IN vec3 viewSpacePosition;\n#endif\n\nstruct Light {\n    vec3 color;\n    vec3 position;\n    vec3 specular;\n\n\n    // * SPOT LIGHT * //\n    #ifdef HAS_SPOT\n        vec3 conePointAt;\n        #define COSCONEANGLE x\n        #define COSCONEANGLEINNER y\n        #define SPOTEXPONENT z\n        vec3 spotProperties;\n    #endif\n\n    #define INTENSITY x\n    #define ATTENUATION y\n    #define FALLOFF z\n    #define RADIUS w\n    vec4 lightProperties;\n\n    int castLight;\n};\n\n/* CONSTANTS */\n#define NONE -1\n#define ALBEDO x\n#define ROUGHNESS y\n#define SHININESS z\n#define SPECULAR_AMT w\n#define NORMAL x\n#define AO y\n#define SPECULAR z\n#define EMISSIVE w\nconst float PI = 3.1415926535897932384626433832795;\nconst float TWO_PI = (2. * PI);\nconst float EIGHT_PI = (8. * PI);\n\n#define RECIPROCAL_PI 1./PI\n#define RECIPROCAL_PI2 RECIPROCAL_PI/2.\n\n// TEXTURES\n// #ifdef HAS_TEXTURES\n    UNI vec4 inTextureIntensities;\n\n    #ifdef HAS_TEXTURE_ENV\n        #ifdef TEX_FORMAT_CUBEMAP\n            UNI samplerCube texEnv;\n            #ifndef WEBGL1\n                #define SAMPLETEX textureLod\n            #endif\n            #ifdef WEBGL1\n                #define SAMPLETEX textureCubeLodEXT\n            #endif\n        #endif\n\n        #ifdef TEX_FORMAT_EQUIRECT\n            UNI sampler2D texEnv;\n            #ifdef WEBGL1\n                // #extension GL_EXT_shader_texture_lod : enable\n                #ifdef GL_EXT_shader_texture_lod\n                    #define textureLod texture2DLodEXT\n                #endif\n                // #define textureLod texture2D\n            #endif\n\n            #define SAMPLETEX sampleEquirect\n\n            const vec2 invAtan = vec2(0.1591, 0.3183);\n            vec4 sampleEquirect(sampler2D tex,vec3 direction,float lod)\n            {\n                #ifndef WEBGL1\n                    vec3 newDirection = normalize(direction);\n            \t\tvec2 sampleUV;\n            \t\tsampleUV.x = -1. * (atan( direction.z, direction.x ) * RECIPROCAL_PI2 + 0.75);\n            \t\tsampleUV.y = asin( clamp(direction.y, -1., 1.) ) * RECIPROCAL_PI + 0.5;\n                #endif\n\n                #ifdef WEBGL1\n                    vec3 newDirection = normalize(direction);\n                \t\tvec2 sampleUV = vec2(atan(newDirection.z, newDirection.x), asin(newDirection.y+1e-6));\n                        sampleUV *= vec2(0.1591, 0.3183);\n                        sampleUV += 0.5;\n                #endif\n                return textureLod(tex, sampleUV, lod);\n            }\n        #endif\n        #ifdef ENVMAP_MATCAP\n            UNI sampler2D texEnv;\n            #ifdef WEBGL1\n                // #extension GL_EXT_shader_texture_lod : enable\n                #ifdef GL_EXT_shader_texture_lod\n                    #define textureLod texture2DLodEXT\n                #endif\n                // #define textureLod texture2D\n            #endif\n\n\n            // * taken & modified from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshmatcap_frag.glsl.js\n            vec2 getMatCapUV(vec3 viewSpacePosition, vec3 viewSpaceNormal) {\n                vec3 viewDir = normalize(-viewSpacePosition);\n            \tvec3 x = normalize(vec3(viewDir.z, 0.0, - viewDir.x));\n            \tvec3 y = normalize(cross(viewDir, x));\n            \tvec2 uv = vec2(dot(x, viewSpaceNormal), dot(y, viewSpaceNormal)) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks\n            \treturn uv;\n            }\n        #endif\n\n        UNI float inEnvMapIntensity;\n        UNI float inEnvMapWidth;\n    #endif\n\n    #ifdef HAS_TEXTURE_LUMINANCE_MASK\n        UNI sampler2D texLuminance;\n        UNI float inLuminanceMaskIntensity;\n    #endif\n\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D texDiffuse;\n    #endif\n\n    #ifdef HAS_TEXTURE_SPECULAR\n        UNI sampler2D texSpecular;\n    #endif\n\n    #ifdef HAS_TEXTURE_NORMAL\n        UNI sampler2D texNormal;\n    #endif\n\n    #ifdef HAS_TEXTURE_AO\n        UNI sampler2D texAO;\n    #endif\n\n    #ifdef HAS_TEXTURE_EMISSIVE\n        UNI sampler2D texEmissive;\n    #endif\n\n    #ifdef HAS_TEXTURE_EMISSIVE_MASK\n        UNI sampler2D texMaskEmissive;\n        UNI float inEmissiveMaskIntensity;\n    #endif\n    #ifdef HAS_TEXTURE_ALPHA\n        UNI sampler2D texAlpha;\n    #endif\n// #endif\n\n{{MODULES_HEAD}}\n\nfloat when_gt(float x, float y) { return max(sign(x - y), 0.0); } // comparator function\nfloat when_lt(float x, float y) { return max(sign(y - x), 0.0); }\nfloat when_eq(float x, float y) { return 1. - abs(sign(x - y)); } // comparator function\nfloat when_neq(float x, float y) { return abs(sign(x - y)); } // comparator function\nfloat when_ge(float x, float y) { return 1.0 - when_lt(x, y); }\nfloat when_le(float x, float y) { return 1.0 - when_gt(x, y); }\n\n#ifdef FALLOFF_MODE_A\n    float CalculateFalloff(float distance, vec3 lightDirection, float falloff, float radius) {\n        // * original falloff\n        float denom = distance / radius + 1.0;\n        float attenuation = 1.0 / (denom*denom);\n        float t = (attenuation - falloff) / (1.0 - falloff);\n        return max(t, 0.0);\n    }\n#endif\n\n#ifdef FALLOFF_MODE_B\n    float CalculateFalloff(float distance, vec3 lightDirection, float falloff, float radius) {\n        float distanceSquared = dot(lightDirection, lightDirection);\n        float factor = distanceSquared * falloff;\n        float smoothFactor = clamp(1. - factor * factor, 0., 1.);\n        float attenuation = smoothFactor * smoothFactor;\n\n        return attenuation * 1. / max(distanceSquared, 0.00001);\n    }\n#endif\n\n#ifdef FALLOFF_MODE_C\n    float CalculateFalloff(float distance, vec3 lightDirection, float falloff, float radius) {\n        // https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n        float falloffNumerator = 1. - pow(distance/radius, 4.);\n        falloffNumerator = clamp(falloffNumerator, 0., 1.);\n        falloffNumerator *= falloffNumerator;\n\n        float denominator = distance*distance + falloff;\n\n        return falloffNumerator/denominator;\n    }\n#endif\n\n#ifdef FALLOFF_MODE_D\n    float CalculateFalloff(float distance, vec3 lightDirection, float falloff, float radius) {\n        // inverse square falloff, \"physically correct\"\n        return 1.0 / max(distance * distance, 0.0001);\n    }\n#endif\n\n#ifdef ENABLE_FRESNEL\n    float CalculateFresnel(vec3 direction, vec3 normal)\n    {\n        vec3 nDirection = normalize( direction );\n        vec3 nNormal = normalize( mat3(viewMatrix) * normal );\n        vec3 halfDirection = normalize( nNormal + nDirection );\n\n        float cosine = dot( halfDirection, nDirection );\n        float product = max( cosine, 0.0 );\n        float factor = pow(product, inFresnelWidthExponent.y);\n\n        return 5. * factor;\n    }\n#endif\n\n#ifdef CONSERVE_ENERGY\n    // http://www.rorydriscoll.com/2009/01/25/energy-conservation-in-games/\n    // http://www.farbrausch.de/~fg/articles/phong.pdf\n    float EnergyConservation(float shininess) {\n        #ifdef SPECULAR_PHONG\n            return (shininess + 2.)/TWO_PI;\n        #endif\n        #ifdef SPECULAR_BLINN\n            return (shininess + 8.)/EIGHT_PI;\n        #endif\n\n        #ifdef SPECULAR_SCHLICK\n            return (shininess + 8.)/EIGHT_PI;\n        #endif\n\n        #ifdef SPECULAR_GAUSS\n            return (shininess + 8.)/EIGHT_PI;\n        #endif\n    }\n#endif\n\n#ifdef ENABLE_OREN_NAYAR_DIFFUSE\n    float CalculateOrenNayar(vec3 lightDirection, vec3 viewDirection, vec3 normal) {\n        float LdotV = dot(lightDirection, viewDirection);\n        float NdotL = dot(lightDirection, normal);\n        float NdotV = dot(normal, viewDirection);\n\n        float albedo = inMaterialProperties.ALBEDO;\n        albedo *= 1.8;\n        float s = LdotV - NdotL * NdotV;\n        float t = mix(1., max(NdotL, NdotV), step(0., s));\n\n        float roughness = inMaterialProperties.ROUGHNESS;\n        float sigma2 = roughness * roughness;\n        float A = 1. + sigma2 * (albedo / (sigma2 + 0.13) + 0.5 / (sigma2 + 0.33));\n        float B = 0.45 * sigma2 / (sigma2 + 0.09);\n\n        float factor = albedo * max(0., NdotL) * (A + B * s / t) / PI;\n\n        return factor;\n\n    }\n#endif\n\nvec3 CalculateDiffuseColor(\n    vec3 lightDirection,\n    vec3 viewDirection,\n    vec3 normal,\n    vec3 lightColor,\n    vec3 materialColor,\n    inout float lambert\n) {\n    #ifndef ENABLE_OREN_NAYAR_DIFFUSE\n        lambert = clamp(dot(lightDirection, normal), 0., 1.);\n    #endif\n\n    #ifdef ENABLE_OREN_NAYAR_DIFFUSE\n        lambert = CalculateOrenNayar(lightDirection, viewDirection, normal);\n    #endif\n\n    vec3 diffuseColor = lambert * lightColor * materialColor;\n    return diffuseColor;\n}\n\nvec3 CalculateSpecularColor(\n    vec3 specularColor,\n    float specularCoefficient,\n    float shininess,\n    vec3 lightDirection,\n    vec3 viewDirection,\n    vec3 normal,\n    float lambertian\n) {\n    vec3 resultColor = vec3(0.);\n\n    #ifdef SPECULAR_PHONG\n        vec3 reflectDirection = reflect(-lightDirection, normal);\n        float specularAngle = max(dot(reflectDirection, viewDirection), 0.);\n        float specularFactor = pow(specularAngle, max(0., shininess));\n    resultColor = lambertian * specularFactor * specularCoefficient * specularColor;\n    #endif\n\n    #ifdef SPECULAR_BLINN\n        vec3 halfDirection = normalize(lightDirection + viewDirection);\n        float specularAngle = max(dot(halfDirection, normal), 0.);\n        float specularFactor = pow(specularAngle, max(0., shininess));\n        resultColor = lambertian * specularFactor * specularCoefficient * specularColor;\n    #endif\n\n    #ifdef SPECULAR_SCHLICK\n        vec3 halfDirection = normalize(lightDirection + viewDirection);\n        float specularAngle = dot(halfDirection, normal);\n        float schlickShininess = max(0., shininess);\n        float specularFactor = specularAngle / (schlickShininess - schlickShininess*specularAngle + specularAngle);\n        resultColor = lambertian * specularFactor * specularCoefficient * specularColor;\n    #endif\n\n    #ifdef SPECULAR_GAUSS\n        vec3 halfDirection = normalize(lightDirection + viewDirection);\n        float specularAngle = acos(max(dot(halfDirection, normal), 0.));\n        float exponent = specularAngle * shininess * 0.17;\n        exponent = -(exponent*exponent);\n        float specularFactor = exp(exponent);\n\n        resultColor = lambertian * specularFactor * specularCoefficient * specularColor;\n    #endif\n\n    #ifdef CONSERVE_ENERGY\n        float conserveEnergyFactor = EnergyConservation(shininess);\n        resultColor = conserveEnergyFactor * resultColor;\n    #endif\n\n    return resultColor;\n}\n\n#ifdef HAS_SPOT\n    float CalculateSpotLightEffect(vec3 lightPosition, vec3 conePointAt, float cosConeAngle, float cosConeAngleInner, float spotExponent, vec3 lightDirection) {\n        vec3 spotLightDirection = normalize(lightPosition-conePointAt);\n        float spotAngle = dot(-lightDirection, spotLightDirection);\n        float epsilon = cosConeAngle - cosConeAngleInner;\n\n        float spotIntensity = clamp((spotAngle - cosConeAngle)/epsilon, 0.0, 1.0);\n        spotIntensity = pow(spotIntensity, max(0.01, spotExponent));\n\n        return max(0., spotIntensity);\n    }\n#endif\n\n\n\n{{PHONG_FRAGMENT_HEAD}}\n\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n\n    vec4 col=vec4(0., 0., 0., inDiffuseColor.a);\n    vec3 calculatedColor = vec3(0.);\n    vec3 normal = normalize(normInterpolated);\n    vec3 baseColor = inDiffuseColor.rgb;\n\n    {{MODULE_BASE_COLOR}}\n\n\n\n    #ifdef AO_CHAN_0\n        vec2 tcAo=texCoord;\n    #endif\n    #ifdef AO_CHAN_1\n        vec2 tcAo=texCoord1;\n    #endif\n\n\n    vec3 viewDirection = normalize(v_viewDirection);\n\n    #ifdef DOUBLE_SIDED\n        if(!gl_FrontFacing) normal = normal * -1.0;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        #ifdef HAS_TEXTURE_DIFFUSE\n            baseColor = texture(texDiffuse, texCoord).rgb;\n\n            #ifdef COLORIZE_TEXTURE\n                baseColor *= inDiffuseColor.rgb;\n            #endif\n        #endif\n\n        #ifdef HAS_TEXTURE_NORMAL\n            normal = texture(texNormal, texCoord).rgb;\n            normal = normalize(normal * 2. - 1.);\n            float normalIntensity = inTextureIntensities.NORMAL;\n            normal = normalize(mix(vec3(0., 0., 1.), normal, 2. * normalIntensity));\n            normal = normalize(TBN_Matrix * normal);\n        #endif\n    #endif\n\n    {{PHONG_FRAGMENT_BODY}}\n\n\n\n\n\n\n    #ifdef ENABLE_FRESNEL\n        calculatedColor += inFresnel.rgb * (CalculateFresnel(vec3(cameraSpace_pos), normal) * inFresnel.w * inFresnelWidthExponent.x);\n    #endif\n\n     #ifdef HAS_TEXTURE_ALPHA\n        #ifdef ALPHA_MASK_ALPHA\n            col.a*=texture(texAlpha,texCoord).a;\n        #endif\n        #ifdef ALPHA_MASK_LUMI\n            col.a*= dot(vec3(0.2126,0.7152,0.0722), texture(texAlpha,texCoord).rgb);\n        #endif\n        #ifdef ALPHA_MASK_R\n            col.a*=texture(texAlpha,texCoord).r;\n        #endif\n        #ifdef ALPHA_MASK_G\n            col.a*=texture(texAlpha,texCoord).g;\n        #endif\n        #ifdef ALPHA_MASK_B\n            col.a*=texture(texAlpha,texCoord).b;\n        #endif\n    #endif\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n\n    #ifdef HAS_TEXTURE_ENV\n        vec3 luminanceColor = vec3(0.);\n\n        #ifndef ENVMAP_MATCAP\n            float environmentMapWidth = inEnvMapWidth;\n            float glossyExponent = inMaterialProperties.SHININESS;\n            float glossyCoefficient = inMaterialProperties.SPECULAR_AMT;\n\n            vec3 envMapNormal =  normal;\n            vec3 reflectDirection = reflect(normalize(-viewDirection), normal);\n\n            float lambertianCoefficient = dot(viewDirection, reflectDirection); //0.44; // TODO: need prefiltered map for this\n            // lambertianCoefficient = 1.;\n            float specularAngle = max(dot(reflectDirection, viewDirection), 0.);\n            float specularFactor = pow(specularAngle, max(0., inMaterialProperties.SHININESS));\n\n            glossyExponent = specularFactor;\n\n            float maxMIPLevel = 10.;\n            float MIPlevel = log2(environmentMapWidth / 1024. * sqrt(3.)) - 0.5 * log2(glossyExponent + 1.);\n\n            luminanceColor = inEnvMapIntensity * (\n                inDiffuseColor.rgb *\n                SAMPLETEX(texEnv, envMapNormal, maxMIPLevel).rgb\n                +\n                glossyCoefficient * SAMPLETEX(texEnv, reflectDirection, MIPlevel).rgb\n            );\n        #endif\n        #ifdef ENVMAP_MATCAP\n            luminanceColor = inEnvMapIntensity * (\n                texture(texEnv, getMatCapUV(viewSpacePosition, viewSpaceNormal)).rgb\n                //inDiffuseColor.rgb\n                //* textureLod(texEnv, getMatCapUV(envMapNormal), maxMIPLevel).rgb\n                //+\n                //glossyCoefficient * textureLod(texEnv, getMatCapUV(reflectDirection), MIPlevel).rgb\n            );\n        #endif\n\n\n\n        #ifdef HAS_TEXTURE_LUMINANCE_MASK\n            luminanceColor *= texture(texLuminance, texCoord).r * inLuminanceMaskIntensity;\n        #endif\n\n        #ifdef HAS_TEXTURE_AO\n            luminanceColor *= texture(texAO, tcAo).r*inTextureIntensities.AO;\n        #endif\n\n        #ifdef ENV_BLEND_ADD\n            calculatedColor.rgb += luminanceColor;\n        #endif\n        #ifdef ENV_BLEND_MUL\n            calculatedColor.rgb *= luminanceColor;\n        #endif\n\n        #ifdef ENV_BLEND_MIX\n            calculatedColor.rgb=mix(luminanceColor,calculatedColor.rgb,luminanceColor);\n        #endif\n\n\n    #endif\n\n    #ifdef ADD_EMISSIVE_COLOR\n        vec3 emissiveRadiance = mix(calculatedColor, inEmissiveColor.rgb, inEmissiveColor.w); // .w = intensity of color;\n\n        #ifdef HAS_TEXTURE_EMISSIVE\n            float emissiveIntensity = inTextureIntensities.EMISSIVE;\n            emissiveRadiance = mix(calculatedColor, texture(texEmissive, texCoord).rgb, emissiveIntensity);\n        #endif\n\n        #ifdef HAS_TEXTURE_EMISSIVE_MASK\n           float emissiveMixValue = mix(1., texture(texMaskEmissive, texCoord).r, inEmissiveMaskIntensity);\n           calculatedColor = mix(calculatedColor, emissiveRadiance, emissiveMixValue);\n        #endif\n\n        #ifndef HAS_TEXTURE_EMISSIVE_MASK\n            calculatedColor = emissiveRadiance;\n        #endif\n    #endif\n\n    col.rgb = clamp(calculatedColor, 0., 1.);\n\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n\n}\n","phong_vert":"\n{{MODULES_HEAD}}\n\n#define NONE -1\n#define AMBIENT 0\n#define POINT 1\n#define DIRECTIONAL 2\n#define SPOT 3\n\n#define TEX_REPEAT_X x;\n#define TEX_REPEAT_Y y;\n#define TEX_OFFSET_X z;\n#define TEX_OFFSET_Y w;\n\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\nIN vec3 attrTangent;\nIN vec3 attrBiTangent;\n\nOUT vec2 texCoord;\nOUT vec3 normInterpolated;\nOUT vec3 fragPos;\n\n#ifdef AO_CHAN_1\n    #ifndef ATTRIB_attrTexCoord1\n        IN vec2 attrTexCoord1;\n        OUT vec2 texCoord1;\n        #define ATTRIB_attrTexCoord1\n        #define ATTRIB_texCoord1\n    #endif\n#endif\n\n#ifdef HAS_TEXTURE_NORMAL\n    OUT mat3 TBN_Matrix; // tangent bitangent normal space transform matrix\n#endif\n\n#ifdef ENABLE_FRESNEL\n    OUT vec4 cameraSpace_pos;\n#endif\n\nOUT vec3 v_viewDirection;\nOUT mat3 normalMatrix;\nOUT mat4 mvMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI vec4 inTextureRepeatOffset;\n#endif\n\nUNI vec3 camPos;\nUNI mat4 projMatrix;\nUNI mat4 viewMatrix;\nUNI mat4 modelMatrix;\n\n#ifdef ENVMAP_MATCAP\n    OUT vec3 viewSpaceNormal;\n    OUT vec3 viewSpacePosition;\n#endif\n\n\nmat3 transposeMat3(mat3 m)\n{\n    return mat3(m[0][0], m[1][0], m[2][0],\n        m[0][1], m[1][1], m[2][1],\n        m[0][2], m[1][2], m[2][2]);\n}\n\nmat3 inverseMat3(mat3 m)\n{\n    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n\n    float b01 = a22 * a11 - a12 * a21;\n    float b11 = -a22 * a10 + a12 * a20;\n    float b21 = a21 * a10 - a11 * a20;\n\n    float det = a00 * b01 + a01 * b11 + a02 * b21;\n\n    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),\n        b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),\n        b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    vec4 pos=vec4(vPosition,  1.0);\n\n    texCoord=attrTexCoord;\n    texCoord.y = 1. - texCoord.y;\n\n    #ifdef ATTRIB_texCoord1\n        texCoord1=attrTexCoord1;\n    #endif\n\n    vec3 norm=attrVertNormal;\n    vec3 tangent = attrTangent;\n    vec3 bitangent = attrBiTangent;\n\n    {{MODULE_VERTEX_POSITION}}\n\n    normalMatrix = transposeMat3(inverseMat3(mat3(mMatrix)));\n    mvMatrix = (viewMatrix * mMatrix);\n\n\n\n    #ifdef ENABLE_FRESNEL\n        cameraSpace_pos = mvMatrix * pos;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        float repeatX = inTextureRepeatOffset.TEX_REPEAT_X;\n        float offsetX = inTextureRepeatOffset.TEX_OFFSET_X;\n        float repeatY = inTextureRepeatOffset.TEX_REPEAT_Y;\n        float offsetY = inTextureRepeatOffset.TEX_OFFSET_Y;\n\n        texCoord.x *= repeatX;\n        texCoord.x += offsetX;\n        texCoord.y *= repeatY;\n        texCoord.y += offsetY;\n    #endif\n\n   normInterpolated = vec3(normalMatrix*norm);\n\n    #ifdef HAS_TEXTURE_NORMAL\n        vec3 normCameraSpace = normalize((vec4(normInterpolated, 0.0)).xyz);\n        vec3 tangCameraSpace = normalize((mMatrix * vec4(tangent, 0.0)).xyz);\n        vec3 bitangCameraSpace = normalize((mMatrix * vec4(bitangent, 0.0)).xyz);\n\n        // re orthogonalization for smoother normals\n        tangCameraSpace = normalize(tangCameraSpace - dot(tangCameraSpace, normCameraSpace) * normCameraSpace);\n        bitangCameraSpace = cross(normCameraSpace, tangCameraSpace);\n\n        TBN_Matrix = mat3(tangCameraSpace, bitangCameraSpace, normCameraSpace);\n    #endif\n\n    fragPos = vec3((mMatrix) * pos);\n    v_viewDirection = normalize(camPos - fragPos);\n    // modelPos=mMatrix*pos;\n\n    #ifdef ENVMAP_MATCAP\n        mat3 viewSpaceNormalMatrix = normalMatrix = transposeMat3(inverseMat3(mat3(mvMatrix)));\n        viewSpaceNormal = normalize(viewSpaceNormalMatrix * norm);\n        viewSpacePosition = vec3(mvMatrix * pos);\n    #endif\n\n    mat4 modelViewMatrix=mvMatrix;\n    {{MODULE_VERTEX_MOVELVIEW}}\n\n\n    gl_Position = projMatrix * modelViewMatrix * pos;\n}\n","snippet_body_ambient_frag":"    // * AMBIENT LIGHT {{LIGHT_INDEX}} *\n    vec3 diffuseColor{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.lightProperties.INTENSITY*phongLight{{LIGHT_INDEX}}.color;\n    calculatedColor += diffuseColor{{LIGHT_INDEX}};\n","snippet_body_directional_frag":"    // * DIRECTIONAL LIGHT {{LIGHT_INDEX}} *\n\n    if (phongLight{{LIGHT_INDEX}}.castLight == 1) {\n        vec3 phongLightDirection{{LIGHT_INDEX}} = normalize(phongLight{{LIGHT_INDEX}}.position);\n\n        float phongLambert{{LIGHT_INDEX}} = 1.; // inout variable\n\n        vec3 lightColor{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.color;\n        vec3 lightSpecular{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.specular;\n\n        #ifdef HAS_TEXTURES\n            #ifdef HAS_TEXTURE_AO\n                // lightColor{{LIGHT_INDEX}} *= mix(vec3(1.), texture(texAO, texCoord).rgb, inTextureIntensities.AO);\n                lightColor{{LIGHT_INDEX}} *= texture(texAO, tcAo).g, inTextureIntensities.AO;\n\n            #endif\n\n            #ifdef HAS_TEXTURE_SPECULAR\n                lightSpecular{{LIGHT_INDEX}} *= mix(1., texture(texSpecular, texCoord).r, inTextureIntensities.SPECULAR);\n            #endif\n        #endif\n\n        vec3 diffuseColor{{LIGHT_INDEX}} = CalculateDiffuseColor(phongLightDirection{{LIGHT_INDEX}}, viewDirection, normal, lightColor{{LIGHT_INDEX}}, baseColor, phongLambert{{LIGHT_INDEX}});\n        vec3 specularColor{{LIGHT_INDEX}} = CalculateSpecularColor(\n            lightSpecular{{LIGHT_INDEX}},\n            inMaterialProperties.SPECULAR_AMT,\n            inMaterialProperties.SHININESS,\n            phongLightDirection{{LIGHT_INDEX}},\n            viewDirection,\n            normal,\n            phongLambert{{LIGHT_INDEX}}\n        );\n\n        vec3 combinedColor{{LIGHT_INDEX}} = (diffuseColor{{LIGHT_INDEX}} + specularColor{{LIGHT_INDEX}});\n\n        vec3 lightModelDiff{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.position - fragPos.xyz;\n\n        combinedColor{{LIGHT_INDEX}} *= phongLight{{LIGHT_INDEX}}.lightProperties.INTENSITY;\n        calculatedColor += combinedColor{{LIGHT_INDEX}};\n    }","snippet_body_point_frag":"// * POINT LIGHT {{LIGHT_INDEX}} *\n    if (phongLight{{LIGHT_INDEX}}.castLight == 1) {\n        vec3 phongLightDirection{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.position - fragPos.xyz;\n        // * get length before normalization for falloff calculation\n        phongLightDirection{{LIGHT_INDEX}} = normalize(phongLightDirection{{LIGHT_INDEX}});\n        float phongLightDistance{{LIGHT_INDEX}} = length(phongLightDirection{{LIGHT_INDEX}});\n\n        float phongLambert{{LIGHT_INDEX}} = 1.; // inout variable\n\n        vec3 lightColor{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.color;\n        vec3 lightSpecular{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.specular;\n\n        #ifdef HAS_TEXTURES\n            #ifdef HAS_TEXTURE_AO\n                lightColor{{LIGHT_INDEX}} -= (1.0-texture(texAO, tcAo).g)* (inTextureIntensities.AO);\n            #endif\n\n            #ifdef HAS_TEXTURE_SPECULAR\n                lightSpecular{{LIGHT_INDEX}} *= mix(1., texture(texSpecular, texCoord).r, inTextureIntensities.SPECULAR);\n            #endif\n        #endif\n\n        vec3 diffuseColor{{LIGHT_INDEX}} = CalculateDiffuseColor(phongLightDirection{{LIGHT_INDEX}}, viewDirection, normal, lightColor{{LIGHT_INDEX}}, baseColor, phongLambert{{LIGHT_INDEX}});\n        vec3 specularColor{{LIGHT_INDEX}} = CalculateSpecularColor(\n            lightSpecular{{LIGHT_INDEX}},\n            inMaterialProperties.SPECULAR_AMT,\n            inMaterialProperties.SHININESS,\n            phongLightDirection{{LIGHT_INDEX}},\n            viewDirection,\n            normal,\n            phongLambert{{LIGHT_INDEX}}\n        );\n\n        vec3 combinedColor{{LIGHT_INDEX}} = (diffuseColor{{LIGHT_INDEX}} + specularColor{{LIGHT_INDEX}});\n\n        combinedColor{{LIGHT_INDEX}} *= phongLight{{LIGHT_INDEX}}.lightProperties.INTENSITY;\n\n        float attenuation{{LIGHT_INDEX}} = CalculateFalloff(\n            phongLightDistance{{LIGHT_INDEX}},\n            phongLightDirection{{LIGHT_INDEX}},\n            phongLight{{LIGHT_INDEX}}.lightProperties.FALLOFF,\n            phongLight{{LIGHT_INDEX}}.lightProperties.RADIUS\n        );\n\n        attenuation{{LIGHT_INDEX}} *= when_gt(phongLambert{{LIGHT_INDEX}}, 0.);\n        combinedColor{{LIGHT_INDEX}} *= attenuation{{LIGHT_INDEX}};\n\n        calculatedColor += combinedColor{{LIGHT_INDEX}};\n    }\n","snippet_body_spot_frag":"    // * SPOT LIGHT {{LIGHT_INDEX}} *\n    if (phongLight{{LIGHT_INDEX}}.castLight == 1) {\n        vec3 phongLightDirection{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.position - fragPos.xyz;\n        phongLightDirection{{LIGHT_INDEX}} = normalize( phongLightDirection{{LIGHT_INDEX}});\n        float phongLightDistance{{LIGHT_INDEX}} = length(phongLightDirection{{LIGHT_INDEX}});\n\n        float phongLambert{{LIGHT_INDEX}} = 1.; // inout variable\n\n        vec3 lightColor{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.color;\n        vec3 lightSpecular{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.specular;\n\n        #ifdef HAS_TEXTURES\n            #ifdef HAS_TEXTURE_AO\n                // lightColor{{LIGHT_INDEX}} *= mix(vec3(1.), texture(texAO, texCoord).rgb, inTextureIntensities.AO);\n                lightColor{{LIGHT_INDEX}} *= texture(texAO, texCoord).g, inTextureIntensities.AO;\n\n            #endif\n\n            #ifdef HAS_TEXTURE_SPECULAR\n                lightSpecular{{LIGHT_INDEX}} *= mix(1., texture(texSpecular, texCoord).r, inTextureIntensities.SPECULAR);\n            #endif\n        #endif\n\n        vec3 diffuseColor{{LIGHT_INDEX}} = CalculateDiffuseColor(phongLightDirection{{LIGHT_INDEX}}, viewDirection, normal, lightColor{{LIGHT_INDEX}}, baseColor, phongLambert{{LIGHT_INDEX}});\n        vec3 specularColor{{LIGHT_INDEX}} = CalculateSpecularColor(\n            lightSpecular{{LIGHT_INDEX}},\n            inMaterialProperties.SPECULAR_AMT,\n            inMaterialProperties.SHININESS,\n            phongLightDirection{{LIGHT_INDEX}},\n            viewDirection,\n            normal,\n            phongLambert{{LIGHT_INDEX}}\n        );\n\n        vec3 combinedColor{{LIGHT_INDEX}} = (diffuseColor{{LIGHT_INDEX}} + specularColor{{LIGHT_INDEX}});\n\n        float spotIntensity{{LIGHT_INDEX}} = CalculateSpotLightEffect(\n            phongLight{{LIGHT_INDEX}}.position, phongLight{{LIGHT_INDEX}}.conePointAt, phongLight{{LIGHT_INDEX}}.spotProperties.COSCONEANGLE,\n            phongLight{{LIGHT_INDEX}}.spotProperties.COSCONEANGLEINNER, phongLight{{LIGHT_INDEX}}.spotProperties.SPOTEXPONENT,\n            phongLightDirection{{LIGHT_INDEX}}\n        );\n\n        combinedColor{{LIGHT_INDEX}} *= spotIntensity{{LIGHT_INDEX}};\n\n        vec3 lightModelDiff{{LIGHT_INDEX}} = phongLight{{LIGHT_INDEX}}.position - fragPos.xyz;\n\n        float attenuation{{LIGHT_INDEX}} = CalculateFalloff(\n            phongLightDistance{{LIGHT_INDEX}},\n            phongLightDirection{{LIGHT_INDEX}},\n            phongLight{{LIGHT_INDEX}}.lightProperties.FALLOFF,\n            phongLight{{LIGHT_INDEX}}.lightProperties.RADIUS\n        );\n\n        attenuation{{LIGHT_INDEX}} *= when_gt(phongLambert{{LIGHT_INDEX}}, 0.);\n\n        combinedColor{{LIGHT_INDEX}} *= attenuation{{LIGHT_INDEX}};\n\n        combinedColor{{LIGHT_INDEX}} *= phongLight{{LIGHT_INDEX}}.lightProperties.INTENSITY;\n        calculatedColor += combinedColor{{LIGHT_INDEX}};\n    }","snippet_head_frag":"UNI Light phongLight{{LIGHT_INDEX}};\n",};
const cgl = op.patch.cgl;

const attachmentFragmentHead = attachments.snippet_head_frag;
const snippets = {
    "point": attachments.snippet_body_point_frag,
    "spot": attachments.snippet_body_spot_frag,
    "ambient": attachments.snippet_body_ambient_frag,
    "directional": attachments.snippet_body_directional_frag,
    "area": attachments.snippet_body_area_frag,
};
const LIGHT_INDEX_REGEX = new RegExp("{{LIGHT_INDEX}}", "g");

const createFragmentHead = (n) => { return attachmentFragmentHead.replace("{{LIGHT_INDEX}}", n); };
const createFragmentBody = (n, type) => { return snippets[type].replace(LIGHT_INDEX_REGEX, n); };

function createDefaultShader()
{
    const vertexShader = attachments.phong_vert;
    let fragmentShader = attachments.phong_frag;

    let fragmentHead = createFragmentHead(0);
    let fragmentBody = createFragmentBody(0, DEFAULT_LIGHTSTACK[0].type);

    fragmentShader = fragmentShader.replace(FRAGMENT_HEAD_REGEX, fragmentHead);
    fragmentShader = fragmentShader.replace(FRAGMENT_BODY_REGEX, fragmentBody);

    shader.setSource(vertexShader, fragmentShader);
    shader.define("HAS_POINT");
    shader.removeDefine("HAS_SPOT");
    shader.removeDefine("HAS_DIRECTIONAL");
    shader.removeDefine("HAS_AMBIENT");
}

const inTrigger = op.inTrigger("Trigger In");

// * DIFFUSE *
const inDiffuseR = op.inFloat("R", Math.random());
const inDiffuseG = op.inFloat("G", Math.random());
const inDiffuseB = op.inFloat("B", Math.random());
const inDiffuseA = op.inFloatSlider("A", 1);
const diffuseColors = [inDiffuseR, inDiffuseG, inDiffuseB, inDiffuseA];
op.setPortGroup("Diffuse Color", diffuseColors);

const inToggleOrenNayar = op.inBool("Enable", false);
const inAlbedo = op.inFloatSlider("Albedo", 0.707);
const inRoughness = op.inFloatSlider("Roughness", 0.835);

inToggleOrenNayar.setUiAttribs({ "hidePort": true });
inAlbedo.setUiAttribs({ "greyout": true });
inRoughness.setUiAttribs({ "greyout": true });
inDiffuseR.setUiAttribs({ "colorPick": true });
op.setPortGroup("Oren-Nayar Diffuse", [inToggleOrenNayar, inAlbedo, inRoughness]);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);

inToggleOrenNayar.onChange = function ()
{
    shader.toggleDefine("ENABLE_OREN_NAYAR_DIFFUSE", inToggleOrenNayar);
    inAlbedo.setUiAttribs({ "greyout": !inToggleOrenNayar.get() });
    inRoughness.setUiAttribs({ "greyout": !inToggleOrenNayar.get() });
};

// * FRESNEL *
const inToggleFresnel = op.inValueBool("Active", false);
inToggleFresnel.setUiAttribs({ "hidePort": true });
const inFresnel = op.inValueSlider("Fresnel Intensity", 0.7);
const inFresnelWidth = op.inFloat("Fresnel Width", 1);
const inFresnelExponent = op.inFloat("Fresnel Exponent", 6);
const inFresnelR = op.inFloat("Fresnel R", 1);
const inFresnelG = op.inFloat("Fresnel G", 1);
const inFresnelB = op.inFloat("Fresnel B", 1);
inFresnelR.setUiAttribs({ "colorPick": true });

const fresnelArr = [inFresnel, inFresnelWidth, inFresnelExponent, inFresnelR, inFresnelG, inFresnelB];
fresnelArr.forEach(function (port) { port.setUiAttribs({ "greyout": true }); });
op.setPortGroup("Fresnel", fresnelArr.concat([inToggleFresnel]));

let uniFresnel = null;
let uniFresnelWidthExponent = null;
inToggleFresnel.onChange = function ()
{
    shader.toggleDefine("ENABLE_FRESNEL", inToggleFresnel);
    if (inToggleFresnel.get())
    {
        if (!uniFresnel) uniFresnel = new CGL.Uniform(shader, "4f", "inFresnel", inFresnelR, inFresnelG, inFresnelB, inFresnel);
        if (!uniFresnelWidthExponent) uniFresnelWidthExponent = new CGL.Uniform(shader, "2f", "inFresnelWidthExponent", inFresnelWidth, inFresnelExponent);
    }
    else
    {
        if (uniFresnel)
        {
            shader.removeUniform("inFresnel");
            uniFresnel = null;
        }

        if (uniFresnelWidthExponent)
        {
            shader.removeUniform("inFresnelWidthExponent");
            uniFresnelWidthExponent = null;
        }
    }

    fresnelArr.forEach(function (port) { port.setUiAttribs({ "greyout": !inToggleFresnel.get() }); });
};
// * EMISSIVE *
const inEmissiveActive = op.inBool("Emissive Active", false);
const inEmissiveColorIntensity = op.inFloatSlider("Color Intensity", 0.3);
const inEmissiveR = op.inFloatSlider("Emissive R", Math.random());
const inEmissiveG = op.inFloatSlider("Emissive G", Math.random());
const inEmissiveB = op.inFloatSlider("Emissive B", Math.random());
inEmissiveR.setUiAttribs({ "colorPick": true });
op.setPortGroup("Emissive Color", [inEmissiveActive, inEmissiveColorIntensity, inEmissiveR, inEmissiveG, inEmissiveB]);

inEmissiveColorIntensity.setUiAttribs({ "greyout": !inEmissiveActive.get() });
inEmissiveR.setUiAttribs({ "greyout": !inEmissiveActive.get() });
inEmissiveG.setUiAttribs({ "greyout": !inEmissiveActive.get() });
inEmissiveB.setUiAttribs({ "greyout": !inEmissiveActive.get() });

let uniEmissiveColor = null;

inEmissiveActive.onChange = () =>
{
    shader.toggleDefine("ADD_EMISSIVE_COLOR", inEmissiveActive);

    if (inEmissiveActive.get())
    {
        uniEmissiveColor = new CGL.Uniform(shader, "4f", "inEmissiveColor", inEmissiveR, inEmissiveG, inEmissiveB, inEmissiveColorIntensity);
        inEmissiveTexture.setUiAttribs({ "greyout": false });
        inEmissiveMaskTexture.setUiAttribs({ "greyout": false });

        if (inEmissiveTexture.get()) inEmissiveIntensity.setUiAttribs({ "greyout": false });
        if (inEmissiveMaskTexture.get()) inEmissiveMaskIntensity.setUiAttribs({ "greyout": false });
    }
    else
    {
        op.log("ayayay");
        inEmissiveTexture.setUiAttribs({ "greyout": true });
        inEmissiveMaskTexture.setUiAttribs({ "greyout": true });
        inEmissiveIntensity.setUiAttribs({ "greyout": true });
        inEmissiveMaskIntensity.setUiAttribs({ "greyout": true });

        shader.removeUniform("inEmissiveColor");
        uniEmissiveColor = null;
    }

    if (inEmissiveTexture.get())
    {
        inEmissiveColorIntensity.setUiAttribs({ "greyout": true });
        inEmissiveR.setUiAttribs({ "greyout": true });
        inEmissiveG.setUiAttribs({ "greyout": true });
        inEmissiveB.setUiAttribs({ "greyout": true });
    }
    else
    {
        if (inEmissiveActive.get())
        {
            inEmissiveColorIntensity.setUiAttribs({ "greyout": false });
            inEmissiveR.setUiAttribs({ "greyout": false });
            inEmissiveG.setUiAttribs({ "greyout": false });
            inEmissiveB.setUiAttribs({ "greyout": false });
        }
        else
        {
            inEmissiveColorIntensity.setUiAttribs({ "greyout": true });
            inEmissiveR.setUiAttribs({ "greyout": true });
            inEmissiveG.setUiAttribs({ "greyout": true });
            inEmissiveB.setUiAttribs({ "greyout": true });
        }
    }
};
// * SPECULAR *
const inShininess = op.inFloat("Shininess", 4);
const inSpecularCoefficient = op.inFloatSlider("Specular Amount", 0.5);
const inSpecularMode = op.inSwitch("Specular Model", ["Blinn", "Schlick", "Phong", "Gauss"], "Blinn");

inSpecularMode.setUiAttribs({ "hidePort": true });
const specularColors = [inShininess, inSpecularCoefficient, inSpecularMode];
op.setPortGroup("Specular", specularColors);

// * LIGHT *
const inEnergyConservation = op.inValueBool("Energy Conservation", false);
const inToggleDoubleSided = op.inBool("Double Sided Material", false);
const inFalloffMode = op.inSwitch("Falloff Mode", ["A", "B", "C", "D"], "A");
inEnergyConservation.setUiAttribs({ "hidePort": true });
inToggleDoubleSided.setUiAttribs({ "hidePort": true });
inFalloffMode.setUiAttribs({ "hidePort": true });
inFalloffMode.onChange = () =>
{
    const MODES = ["A", "B", "C", "D"];
    shader.define("FALLOFF_MODE_" + inFalloffMode.get());
    MODES.filter((mode) => { return mode !== inFalloffMode.get(); })
        .forEach((mode) => { return shader.removeDefine("FALLOFF_MODE_" + mode); });
};

const lightProps = [inEnergyConservation, inToggleDoubleSided, inFalloffMode];
op.setPortGroup("Light Options", lightProps);

// TEXTURES
const inDiffuseTexture = op.inTexture("Diffuse Texture");
const inSpecularTexture = op.inTexture("Specular Texture");
const inNormalTexture = op.inTexture("Normal Map");
const inAoTexture = op.inTexture("AO Texture");
const inEmissiveTexture = op.inTexture("Emissive Texture");
const inEmissiveMaskTexture = op.inTexture("Emissive Mask");
const inAlphaTexture = op.inTexture("Opacity Texture");
const inEnvTexture = op.inTexture("Environment Map");
const inLuminanceMaskTexture = op.inTexture("Env Map Mask");
op.setPortGroup("Textures", [inDiffuseTexture, inSpecularTexture, inNormalTexture, inAoTexture, inEmissiveTexture, inEmissiveMaskTexture, inAlphaTexture, inEnvTexture, inLuminanceMaskTexture]);

// TEXTURE TRANSFORMS
const inColorizeTexture = op.inBool("Colorize Texture", false);
const inDiffuseRepeatX = op.inFloat("Diffuse Repeat X", 1);
const inDiffuseRepeatY = op.inFloat("Diffuse Repeat Y", 1);
const inTextureOffsetX = op.inFloat("Texture Offset X", 0);
const inTextureOffsetY = op.inFloat("Texture Offset Y", 0);

const inSpecularIntensity = op.inFloatSlider("Specular Intensity", 1);
const inNormalIntensity = op.inFloatSlider("Normal Map Intensity", 0.5);
const inAoIntensity = op.inFloatSlider("AO Intensity", 1);
const inAoChannel = op.inSwitch("AO UV Channel", ["1", "2"], 1);
const inEmissiveIntensity = op.inFloatSlider("Emissive Intensity", 1);
const inEmissiveMaskIntensity = op.inFloatSlider("Emissive Mask Intensity", 1);
const inEnvMapIntensity = op.inFloatSlider("Env Map Intensity", 1);
const inEnvMapBlend = op.inSwitch("Env Map Blend", ["Add", "Multiply", "Mix"], "Add");
const inLuminanceMaskIntensity = op.inFloatSlider("Env Mask Intensity", 1);

inColorizeTexture.setUiAttribs({ "hidePort": true });
op.setPortGroup("Texture Transforms", [inColorizeTexture, inDiffuseRepeatY, inDiffuseRepeatX, inTextureOffsetY, inTextureOffsetX]);
op.setPortGroup("Texture Intensities", [inNormalIntensity, inAoIntensity, inSpecularIntensity, inEmissiveIntensity, inEnvMapBlend, inEmissiveMaskIntensity, inEnvMapIntensity, inLuminanceMaskIntensity]);
const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });

const discardTransPxl = op.inValueBool("Discard Transparent Pixels");
discardTransPxl.setUiAttribs({ "hidePort": true });

op.setPortGroup("Opacity Texture", [alphaMaskSource, discardTransPxl]);

inAoChannel.onChange =
    inEnvMapBlend.onChange =
    alphaMaskSource.onChange = updateDefines;

const outTrigger = op.outTrigger("Trigger Out");
const shaderOut = op.outObject("Shader", null, "shader");
shaderOut.ignoreValueSerialize = true;

const shader = new CGL.Shader(cgl, "phongmaterial_" + op.id, this);
shader.op = this;
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG", "MODULE_BASE_COLOR", "MODULE_VERTEX_MOVELVIEW"]);
shader.setSource(attachments.simosphong_vert, attachments.simosphong_frag);
// let recompileShader = false;
shader.define("FALLOFF_MODE_A");

if (cgl.glVersion < 2)
{
    shader.enableExtension("GL_OES_standard_derivatives");

    if (cgl.enableExtension("OES_texture_float")) shader.enableExtension("GL_OES_texture_float");
    else op.log("error loading extension OES_texture_float");

    if (cgl.enableExtension("OES_texture_float_linear")) shader.enableExtension("GL_OES_texture_float_linear");
    else op.log("error loading extention OES_texture_float_linear");

    if (cgl.enableExtension("GL_OES_texture_half_float")) shader.enableExtension("GL_OES_texture_half_float");
    else op.log("error loading extention GL_OES_texture_half_float");

    if (cgl.enableExtension("GL_OES_texture_half_float_linear")) shader.enableExtension("GL_OES_texture_half_float_linear");
    else op.log("error loading extention GL_OES_texture_half_float_linear");
}

const FRAGMENT_HEAD_REGEX = new RegExp("{{PHONG_FRAGMENT_HEAD}}", "g");
const FRAGMENT_BODY_REGEX = new RegExp("{{PHONG_FRAGMENT_BODY}}", "g");

const hasLight = {
    "directional": false,
    "spot": false,
    "ambient": false,
    "point": false,
};

function createShader(lightStack)
{
    let fragmentShader = attachments.phong_frag;

    let fragmentHead = "";
    let fragmentBody = "";

    hasLight.directional = false;
    hasLight.spot = false;
    hasLight.ambient = false;
    hasLight.point = false;

    for (let i = 0; i < lightStack.length; i += 1)
    {
        const light = lightStack[i];

        const type = light.type;

        if (!hasLight[type])
        {
            hasLight[type] = true;
        }

        fragmentHead = fragmentHead.concat(createFragmentHead(i));
        fragmentBody = fragmentBody.concat(createFragmentBody(i, light.type));
    }

    fragmentShader = fragmentShader.replace(FRAGMENT_HEAD_REGEX, fragmentHead);
    fragmentShader = fragmentShader.replace(FRAGMENT_BODY_REGEX, fragmentBody);

    shader.setSource(attachments.phong_vert, fragmentShader);

    for (let i = 0, keys = Object.keys(hasLight); i < keys.length; i += 1)
    {
        const key = keys[i];

        if (hasLight[key])
        {
            if (!shader.hasDefine("HAS_" + key.toUpperCase()))
            {
                shader.define("HAS_" + key.toUpperCase());
            }
        }
        else
        {
            if (shader.hasDefine("HAS_" + key.toUpperCase()))
            {
                shader.removeDefine("HAS_" + key.toUpperCase());
            }
        }
    }
}

shaderOut.set(shader);

let diffuseTextureUniform = null;
let specularTextureUniform = null;
let normalTextureUniform = null;
let aoTextureUniform = null;
let emissiveTextureUniform = null;
let emissiveMaskTextureUniform = null;
let emissiveMaskIntensityUniform = null;
let alphaTextureUniform = null;
let envTextureUniform = null;
let inEnvMapIntensityUni = null;
let inEnvMapWidthUni = null;
let luminanceTextureUniform = null;
let inLuminanceMaskIntensityUniform = null;

inColorizeTexture.onChange = function ()
{
    shader.toggleDefine("COLORIZE_TEXTURE", inColorizeTexture.get());
};

function updateDiffuseTexture()
{
    if (inDiffuseTexture.get())
    {
        if (!shader.hasDefine("HAS_TEXTURE_DIFFUSE"))
        {
            shader.define("HAS_TEXTURE_DIFFUSE");
            if (!diffuseTextureUniform) diffuseTextureUniform = new CGL.Uniform(shader, "t", "texDiffuse", 0);
        }
    }
    else
    {
        shader.removeUniform("texDiffuse");
        shader.removeDefine("HAS_TEXTURE_DIFFUSE");
        diffuseTextureUniform = null;
    }
}

function updateSpecularTexture()
{
    if (inSpecularTexture.get())
    {
        inSpecularIntensity.setUiAttribs({ "greyout": false });
        if (!shader.hasDefine("HAS_TEXTURE_SPECULAR"))
        {
            shader.define("HAS_TEXTURE_SPECULAR");
            if (!specularTextureUniform) specularTextureUniform = new CGL.Uniform(shader, "t", "texSpecular", 0);
        }
    }
    else
    {
        inSpecularIntensity.setUiAttribs({ "greyout": true });
        shader.removeUniform("texSpecular");
        shader.removeDefine("HAS_TEXTURE_SPECULAR");
        specularTextureUniform = null;
    }
}

function updateNormalTexture()
{
    if (inNormalTexture.get())
    {
        inNormalIntensity.setUiAttribs({ "greyout": false });

        if (!shader.hasDefine("HAS_TEXTURE_NORMAL"))
        {
            shader.define("HAS_TEXTURE_NORMAL");
            if (!normalTextureUniform) normalTextureUniform = new CGL.Uniform(shader, "t", "texNormal", 0);
        }
    }
    else
    {
        inNormalIntensity.setUiAttribs({ "greyout": true });

        shader.removeUniform("texNormal");
        shader.removeDefine("HAS_TEXTURE_NORMAL");
        normalTextureUniform = null;
    }
}

aoTextureUniform = new CGL.Uniform(shader, "t", "texAO");

function updateAoTexture()
{
    shader.toggleDefine("HAS_TEXTURE_AO", inAoTexture.get());

    inAoIntensity.setUiAttribs({ "greyout": !inAoTexture.get() });

    // if (inAoTexture.get())
    // {
    //     // inAoIntensity.setUiAttribs({ "greyout": false });

    //     // if (!shader.hasDefine("HAS_TEXTURE_AO"))
    //     // {
    //         // shader.define("HAS_TEXTURE_AO");
    //         // if (!aoTextureUniform)
    //         aoTextureUniform = new CGL.Uniform(shader, "t", "texAO", 0);
    //     // }
    // }
    // else
    // {
    //     // inAoIntensity.setUiAttribs({ "greyout": true });

    //     shader.removeUniform("texAO");
    //     // shader.removeDefine("HAS_TEXTURE_AO");
    //     aoTextureUniform = null;
    // }
}

function updateEmissiveTexture()
{
    if (inEmissiveTexture.get())
    {
        inEmissiveR.setUiAttribs({ "greyout": true });
        inEmissiveG.setUiAttribs({ "greyout": true });
        inEmissiveB.setUiAttribs({ "greyout": true });
        inEmissiveColorIntensity.setUiAttribs({ "greyout": true });

        if (inEmissiveActive.get())
        {
            inEmissiveIntensity.setUiAttribs({ "greyout": false });
        }

        if (!shader.hasDefine("HAS_TEXTURE_EMISSIVE"))
        {
            shader.define("HAS_TEXTURE_EMISSIVE");
            if (!emissiveTextureUniform) emissiveTextureUniform = new CGL.Uniform(shader, "t", "texEmissive", 0);
        }
    }
    else
    {
        inEmissiveIntensity.setUiAttribs({ "greyout": true });

        if (inEmissiveActive.get())
        {
            inEmissiveR.setUiAttribs({ "greyout": false });
            inEmissiveG.setUiAttribs({ "greyout": false });
            inEmissiveB.setUiAttribs({ "greyout": false });
            inEmissiveColorIntensity.setUiAttribs({ "greyout": false });
        }
        else
        {
            inEmissiveTexture.setUiAttribs({ "greyout": true });
        }

        shader.removeUniform("texEmissive");
        shader.removeDefine("HAS_TEXTURE_EMISSIVE");
        emissiveTextureUniform = null;
    }
}

function updateEmissiveMaskTexture()
{
    if (inEmissiveMaskTexture.get())
    { // we have a emissive texture
        if (inEmissiveActive.get())
        {
            inEmissiveMaskIntensity.setUiAttribs({ "greyout": false });
        }

        if (!shader.hasDefine("HAS_TEXTURE_EMISSIVE_MASK"))
        {
            shader.define("HAS_TEXTURE_EMISSIVE_MASK");
            if (!emissiveMaskTextureUniform) emissiveMaskTextureUniform = new CGL.Uniform(shader, "t", "texMaskEmissive", 0);
            if (!emissiveMaskIntensityUniform) emissiveMaskIntensityUniform = new CGL.Uniform(shader, "f", "inEmissiveMaskIntensity", inEmissiveMaskIntensity);
        }
    }
    else
    {
        if (!inEmissiveActive.get())
        {
            inEmissiveMaskTexture.setUiAttribs({ "greyout": true });
        }
        inEmissiveMaskIntensity.setUiAttribs({ "greyout": true });
        shader.removeUniform("texMaskEmissive");
        shader.removeUniform("inEmissiveMaskIntensity");
        shader.removeDefine("HAS_TEXTURE_EMISSIVE_MASK");
        emissiveMaskTextureUniform = null;
        emissiveMaskIntensityUniform = null;
    }
}

let updateEnvTextureLater = false;
function updateEnvTexture()
{
    shader.toggleDefine("HAS_TEXTURE_ENV", inEnvTexture.get());

    inEnvMapIntensity.setUiAttribs({ "greyout": !inEnvTexture.get() });

    if (inEnvTexture.get())
    {
        if (!envTextureUniform) envTextureUniform = new CGL.Uniform(shader, "t", "texEnv", 0);

        shader.toggleDefine("TEX_FORMAT_CUBEMAP", inEnvTexture.get().cubemap);

        if (inEnvTexture.get().cubemap)
        {
            shader.removeDefine("TEX_FORMAT_EQUIRECT");
            shader.removeDefine("ENVMAP_MATCAP");
            if (!inEnvMapIntensityUni)inEnvMapIntensityUni = new CGL.Uniform(shader, "f", "inEnvMapIntensity", inEnvMapIntensity);
            if (!inEnvMapWidthUni)inEnvMapWidthUni = new CGL.Uniform(shader, "f", "inEnvMapWidth", inEnvTexture.get().cubemap.width);
        }
        else
        {
            const isSquare = inEnvTexture.get().width === inEnvTexture.get().height;
            shader.toggleDefine("TEX_FORMAT_EQUIRECT", !isSquare);
            shader.toggleDefine("ENVMAP_MATCAP", isSquare);

            if (!inEnvMapIntensityUni)inEnvMapIntensityUni = new CGL.Uniform(shader, "f", "inEnvMapIntensity", inEnvMapIntensity);
            if (!inEnvMapWidthUni) inEnvMapWidthUni = new CGL.Uniform(shader, "f", "inEnvMapWidth", inEnvTexture.get().width);
        }
    }
    else
    {
        shader.removeUniform("inEnvMapIntensity");
        shader.removeUniform("inEnvMapWidth");
        shader.removeUniform("texEnv");
        shader.removeDefine("HAS_TEXTURE_ENV");
        shader.removeDefine("ENVMAP_MATCAP");
        envTextureUniform = null;
        inEnvMapIntensityUni = null;
    }

    updateEnvTextureLater = false;
}

function updateLuminanceMaskTexture()
{
    if (inLuminanceMaskTexture.get())
    {
        inLuminanceMaskIntensity.setUiAttribs({ "greyout": false });
        if (!luminanceTextureUniform)
        {
            shader.define("HAS_TEXTURE_LUMINANCE_MASK");
            luminanceTextureUniform = new CGL.Uniform(shader, "t", "texLuminance", 0);
            inLuminanceMaskIntensityUniform = new CGL.Uniform(shader, "f", "inLuminanceMaskIntensity", inLuminanceMaskIntensity);
        }
    }
    else
    {
        inLuminanceMaskIntensity.setUiAttribs({ "greyout": true });
        shader.removeDefine("HAS_TEXTURE_LUMINANCE_MASK");
        shader.removeUniform("inLuminanceMaskIntensity");
        shader.removeUniform("texLuminance");
        luminanceTextureUniform = null;
        inLuminanceMaskIntensityUniform = null;
    }
}

// TEX OPACITY

function updateDefines()
{
    shader.toggleDefine("ENV_BLEND_ADD", inEnvMapBlend.get() == "Add");
    shader.toggleDefine("ENV_BLEND_MUL", inEnvMapBlend.get() == "Multiply");
    shader.toggleDefine("ENV_BLEND_MIX", inEnvMapBlend.get() == "Mix");

    shader.toggleDefine("ALPHA_MASK_ALPHA", alphaMaskSource.get() == "Alpha Channel");
    shader.toggleDefine("ALPHA_MASK_LUMI", alphaMaskSource.get() == "Luminance");
    shader.toggleDefine("ALPHA_MASK_R", alphaMaskSource.get() == "R");
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get() == "G");
    shader.toggleDefine("ALPHA_MASK_B", alphaMaskSource.get() == "B");

    shader.toggleDefine("AO_CHAN_0", inAoChannel.get() == "1");
    shader.toggleDefine("AO_CHAN_1", inAoChannel.get() == "2");
}

function updateAlphaTexture()
{
    if (inAlphaTexture.get())
    {
        if (alphaTextureUniform !== null) return;
        shader.removeUniform("texAlpha");
        shader.define("HAS_TEXTURE_ALPHA");
        if (!alphaTextureUniform) alphaTextureUniform = new CGL.Uniform(shader, "t", "texAlpha", 0);

        alphaMaskSource.setUiAttribs({ "greyout": false });
        discardTransPxl.setUiAttribs({ "greyout": false });
    }
    else
    {
        shader.removeUniform("texAlpha");
        shader.removeDefine("HAS_TEXTURE_ALPHA");
        alphaTextureUniform = null;

        alphaMaskSource.setUiAttribs({ "greyout": true });
        discardTransPxl.setUiAttribs({ "greyout": true });
    }
    updateDefines();
}

discardTransPxl.onChange = function ()
{
    shader.toggleDefine("DISCARDTRANS", discardTransPxl.get());
};

inDiffuseTexture.onChange = updateDiffuseTexture;
inSpecularTexture.onChange = updateSpecularTexture;
inNormalTexture.onChange = updateNormalTexture;
inAoTexture.onChange = updateAoTexture;
inEmissiveTexture.onChange = updateEmissiveTexture;
inEmissiveMaskTexture.onChange = updateEmissiveMaskTexture;
inAlphaTexture.onChange = updateAlphaTexture;
inEnvTexture.onChange = () => { updateEnvTextureLater = true; };
inLuminanceMaskTexture.onChange = updateLuminanceMaskTexture;

const MAX_UNIFORM_FRAGMENTS = cgl.maxUniformsFrag;
const MAX_LIGHTS = MAX_UNIFORM_FRAGMENTS === 64 ? 6 : 16;

shader.define("MAX_LIGHTS", MAX_LIGHTS.toString());
shader.define("SPECULAR_PHONG");

inSpecularMode.onChange = function ()
{
    if (inSpecularMode.get() === "Phong")
    {
        shader.define("SPECULAR_PHONG");
        shader.removeDefine("SPECULAR_BLINN");
        shader.removeDefine("SPECULAR_GAUSS");
        shader.removeDefine("SPECULAR_SCHLICK");
    }
    else if (inSpecularMode.get() === "Blinn")
    {
        shader.define("SPECULAR_BLINN");
        shader.removeDefine("SPECULAR_PHONG");
        shader.removeDefine("SPECULAR_GAUSS");
        shader.removeDefine("SPECULAR_SCHLICK");
    }
    else if (inSpecularMode.get() === "Gauss")
    {
        shader.define("SPECULAR_GAUSS");
        shader.removeDefine("SPECULAR_BLINN");
        shader.removeDefine("SPECULAR_PHONG");
        shader.removeDefine("SPECULAR_SCHLICK");
    }
    else if (inSpecularMode.get() === "Schlick")
    {
        shader.define("SPECULAR_SCHLICK");
        shader.removeDefine("SPECULAR_BLINN");
        shader.removeDefine("SPECULAR_PHONG");
        shader.removeDefine("SPECULAR_GAUSS");
    }
};

inEnergyConservation.onChange = function ()
{
    shader.toggleDefine("CONSERVE_ENERGY", inEnergyConservation.get());
};

inToggleDoubleSided.onChange = function ()
{
    shader.toggleDefine("DOUBLE_SIDED", inToggleDoubleSided.get());
};

// * INIT UNIFORMS *

const uniMaterialProps = new CGL.Uniform(shader, "4f", "inMaterialProperties", inAlbedo, inRoughness, inShininess, inSpecularCoefficient);
const uniDiffuseColor = new CGL.Uniform(shader, "4f", "inDiffuseColor", inDiffuseR, inDiffuseG, inDiffuseB, inDiffuseA);
const uniTextureIntensities = new CGL.Uniform(shader, "4f", "inTextureIntensities", inNormalIntensity, inAoIntensity, inSpecularIntensity, inEmissiveIntensity);
const uniTextureRepeatOffset = new CGL.Uniform(shader, "4f", "inTextureRepeatOffset", inDiffuseRepeatX, inDiffuseRepeatY, inTextureOffsetX, inTextureOffsetY);

shader.uniformColorDiffuse = uniDiffuseColor;

const lightUniforms = [];
let oldCount = 0;

function createUniforms(lightsCount)
{
    for (let i = 0; i < lightUniforms.length; i += 1)
    {
        lightUniforms[i] = null;
    }

    for (let i = 0; i < lightsCount; i += 1)
    {
        lightUniforms[i] = null;
        if (!lightUniforms[i])
        {
            lightUniforms[i] = {
                "color": new CGL.Uniform(shader, "3f", "phongLight" + i + ".color", [1, 1, 1]),
                "position": new CGL.Uniform(shader, "3f", "phongLight" + i + ".position", [0, 11, 0]),
                "specular": new CGL.Uniform(shader, "3f", "phongLight" + i + ".specular", [1, 1, 1]),
                // intensity, attenuation, falloff, radius
                "lightProperties": new CGL.Uniform(shader, "4f", "phongLight" + i + ".lightProperties", [1, 1, 1, 1]),

                "conePointAt": new CGL.Uniform(shader, "3f", "phongLight" + i + ".conePointAt", vec3.create()),
                "spotProperties": new CGL.Uniform(shader, "3f", "phongLight" + i + ".spotProperties", [0, 0, 0, 0]),
                "castLight": new CGL.Uniform(shader, "i", "phongLight" + i + ".castLight", 1),

            };
        }
    }
}

function setDefaultUniform(light)
{
    defaultUniform.position.setValue(light.position);
    defaultUniform.color.setValue(light.color);
    defaultUniform.specular.setValue(light.specular);
    defaultUniform.lightProperties.setValue([
        light.intensity,
        light.attenuation,
        light.falloff,
        light.radius,
    ]);

    defaultUniform.conePointAt.setValue(light.conePointAt);
    defaultUniform.spotProperties.setValue([
        light.cosConeAngle,
        light.cosConeAngleInner,
        light.spotExponent,
    ]);
}

function setUniforms(lightStack)
{
    for (let i = 0; i < lightStack.length; i += 1)
    {
        const light = lightStack[i];
        light.isUsed = true;

        lightUniforms[i].position.setValue(light.position);
        lightUniforms[i].color.setValue(light.color);
        lightUniforms[i].specular.setValue(light.specular);

        lightUniforms[i].lightProperties.setValue([
            light.intensity,
            light.attenuation,
            light.falloff,
            light.radius,
        ]);

        lightUniforms[i].conePointAt.setValue(light.conePointAt);
        lightUniforms[i].spotProperties.setValue([
            light.cosConeAngle,
            light.cosConeAngleInner,
            light.spotExponent,
        ]);

        lightUniforms[i].castLight.setValue(light.castLight);
    }
}

function compareLights(lightStack)
{
    if (lightStack.length !== oldCount)
    {
        createShader(lightStack);
        createUniforms(lightStack.length);
        oldCount = lightStack.length;
        setUniforms(lightStack);
        // recompileShader = false;
    }
    else
    {
        // if (recompileShader)
        // {
        //     createShader(lightStack);
        //     createUniforms(lightStack.length);
        //     recompileShader = false;
        // }
        setUniforms(lightStack);
    }
}

let defaultUniform = null;

function createDefaultUniform()
{
    defaultUniform = {
        "color": new CGL.Uniform(shader, "3f", "phongLight" + 0 + ".color", [1, 1, 1]),
        "specular": new CGL.Uniform(shader, "3f", "phongLight" + 0 + ".specular", [1, 1, 1]),
        "position": new CGL.Uniform(shader, "3f", "phongLight" + 0 + ".position", [0, 11, 0]),
        // intensity, attenuation, falloff, radius
        "lightProperties": new CGL.Uniform(shader, "4f", "phongLight" + 0 + ".lightProperties", [1, 1, 1, 1]),
        "conePointAt": new CGL.Uniform(shader, "3f", "phongLight" + 0 + ".conePointAt", vec3.create()),
        "spotProperties": new CGL.Uniform(shader, "3f", "phongLight" + 0 + ".spotProperties", [0, 0, 0, 0]),
        "castLight": new CGL.Uniform(shader, "i", "phongLight" + 0 + ".castLight", 1),
    };
}

const DEFAULT_LIGHTSTACK = [{
    "type": "point",
    "position": [5, 5, 5],
    "color": [1, 1, 1],
    "specular": [1, 1, 1],
    "intensity": 1,
    "attenuation": 0,
    "falloff": 0.5,
    "radius": 80,
    "castLight": 1,
}];

const iViewMatrix = mat4.create();

function updateLights()
{
    if (cgl.frameStore.lightStack)
    {
        if (cgl.frameStore.lightStack.length === 0)
        {
            op.setUiError("deflight", "Default light is enabled. Please add lights to your patch to make this warning disappear.", 1);
        }
        else op.setUiError("deflight", null);
    }

    if ((!cgl.frameStore.lightStack || !cgl.frameStore.lightStack.length))
    {
        // if no light in light stack, use default light & set count to -1
        // so when a new light gets added, the shader does recompile
        if (!defaultUniform)
        {
            createDefaultShader();
            createDefaultUniform();
        }

        mat4.invert(iViewMatrix, cgl.vMatrix);
        // set default light position to camera position
        DEFAULT_LIGHTSTACK[0].position = [iViewMatrix[12], iViewMatrix[13], iViewMatrix[14]];
        setDefaultUniform(DEFAULT_LIGHTSTACK[0]);

        oldCount = -1;
    }
    else
    {
        if (shader)
        {
            if (cgl.frameStore.lightStack)
            {
                if (cgl.frameStore.lightStack.length)
                {
                    defaultUniform = null;
                    compareLights(cgl.frameStore.lightStack);
                }
            }
        }
    }
}

const render = function ()
{
    if (!shader)
    {
        op.log("NO SHADER");
        return;
    }

    cgl.pushShader(shader);
    shader.popTextures();

    outTrigger.trigger();
    cgl.popShader();
};

op.preRender = function ()
{
    shader.bind();
    render();
};

/* transform for default light */
const inverseViewMat = mat4.create();
const vecTemp = vec3.create();
const camPos = vec3.create();

inTrigger.onTriggered = function ()
{
    if (!shader)
    {
        op.log("phong has no shader...");
        return;
    }

    if (updateEnvTextureLater)updateEnvTexture();

    cgl.pushShader(shader);

    shader.popTextures();

    if (inDiffuseTexture.get()) shader.pushTexture(diffuseTextureUniform, inDiffuseTexture.get());
    if (inSpecularTexture.get()) shader.pushTexture(specularTextureUniform, inSpecularTexture.get());
    if (inNormalTexture.get()) shader.pushTexture(normalTextureUniform, inNormalTexture.get());
    if (inAoTexture.get()) shader.pushTexture(aoTextureUniform, inAoTexture.get());
    if (inEmissiveTexture.get()) shader.pushTexture(emissiveTextureUniform, inEmissiveTexture.get());
    if (inEmissiveMaskTexture.get()) shader.pushTexture(emissiveMaskTextureUniform, inEmissiveMaskTexture.get());
    if (inAlphaTexture.get()) shader.pushTexture(alphaTextureUniform, inAlphaTexture.get());
    if (inEnvTexture.get())
    {
        if (inEnvTexture.get().cubemap) shader.pushTexture(envTextureUniform, inEnvTexture.get().cubemap, cgl.gl.TEXTURE_CUBE_MAP);
        else shader.pushTexture(envTextureUniform, inEnvTexture.get());
    }

    if (inLuminanceMaskTexture.get())
    {
        shader.pushTexture(luminanceTextureUniform, inLuminanceMaskTexture.get());
    }

    updateLights();

    outTrigger.trigger();

    cgl.popShader();
};

if (cgl.glVersion == 1)
{
    if (!cgl.enableExtension("EXT_shader_texture_lod"))
    {
        op.log("no EXT_shader_texture_lod texture extension");
        // throw "no EXT_shader_texture_lod texture extension";
    }
    else
    {
        shader.enableExtension("GL_EXT_shader_texture_lod");
        cgl.enableExtension("OES_texture_float");
        cgl.enableExtension("OES_texture_float_linear");
        cgl.enableExtension("OES_texture_half_float");
        cgl.enableExtension("OES_texture_half_float_linear");

        shader.enableExtension("GL_OES_standard_derivatives");
        shader.enableExtension("GL_OES_texture_float");
        shader.enableExtension("GL_OES_texture_float_linear");
        shader.enableExtension("GL_OES_texture_half_float");
        shader.enableExtension("GL_OES_texture_half_float_linear");
    }
}

updateDiffuseTexture();
updateSpecularTexture();
updateNormalTexture();
updateAoTexture();
updateAlphaTexture();
updateEmissiveTexture();
updateEmissiveMaskTexture();
updateEnvTexture();
updateLuminanceMaskTexture();


};

Ops.Gl.Phong.PhongMaterial_v6.prototype = new CABLES.Op();
CABLES.OPS["0d83ed06-cdbe-4fe0-87bb-0ccece7fb6e1"]={f:Ops.Gl.Phong.PhongMaterial_v6,objName:"Ops.Gl.Phong.PhongMaterial_v6"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.VertexDisplacementMap_v4
// 
// **************************************************************

Ops.Gl.ShaderEffects.VertexDisplacementMap_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"vertdisplace_body_vert":"\nvec2 MOD_tc=texCoord;\n\n#ifdef MOD_COORD_MESHXY\n    MOD_tc=pos.xy;\n#endif\n#ifdef MOD_COORD_MESHXZ\n    MOD_tc=pos.xz;\n#endif\n\n\n#ifdef MOD_FLIP_Y\n    MOD_tc.y=1.0-MOD_tc.y;\n#endif\n#ifdef MOD_FLIP_X\n    MOD_tc.x=1.0-MOD_tc.x;\n#endif\n#ifdef MOD_FLIP_XY\n    MOD_tc=1.0-MOD_tc;\n#endif\n\nMOD_tc*=MOD_scale;\n\nvec4 MOD_sample=texture( MOD_texture, vec2(MOD_tc.x+MOD_offsetX,MOD_tc.y+MOD_offsetY) );\nvec3 MOD_disp;\n\n#ifdef MOD_INPUT_R\n    MOD_disp=vec3(MOD_sample.r);\n#endif\n#ifdef MOD_INPUT_G\n    MOD_disp=vec3(MOD_sample.g);\n#endif\n#ifdef MOD_INPUT_B\n    MOD_disp=vec3(MOD_sample.b);\n#endif\n#ifdef MOD_INPUT_A\n    MOD_disp=vec3(MOD_sample.a);\n#endif\n#ifdef MOD_INPUT_RGB\n    MOD_disp=MOD_sample.rgb;\n#endif\n#ifdef MOD_INPUT_LUMI\n    MOD_disp=vec3(dot(vec3(0.2126,0.7152,0.0722), MOD_sample.rgb));\n#endif\n\n\n\n#ifdef MOD_HEIGHTMAP_INVERT\n   MOD_disp=1.0-MOD_disp;\n#endif\n// #ifdef MOD_HEIGHTMAP_NORMALIZE\n//   MOD_disp-=0.5;\n//   MOD_disp*=2.0;\n// #endif\n\n\n#ifdef MOD_HEIGHTMAP_NORMALIZE\n    MOD_disp=(MOD_disp-0.5)*2.0;\n    // MOD_disp=(MOD_disp-0.5)*-1.0+0.5;\n#endif\n\n\nfloat MOD_zero=0.0;\n\n#ifdef MOD_MODE_DIV\n    MOD_zero=1.0;\n#endif\n#ifdef MOD_MODE_MUL\n    MOD_zero=1.0;\n#endif\n\n\n\nvec3 MOD_mask=vec3(1.0);\n\n#ifdef MOD_AXIS_X\n    MOD_mask=vec3(1.,0.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_Y\n    MOD_mask=vec3(0.,1.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_Z\n    MOD_mask=vec3(0.,0.,1.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_XY\n    MOD_mask=vec3(1.,1.,0.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n#ifdef MOD_AXIS_XYZ\n    MOD_mask=vec3(1.,1.,1.);\n    MOD_disp*=MOD_mask*MOD_extrude;\n#endif\n\n\n// MOD_disp=smoothstep(-1.,1.,MOD_disp*MOD_disp*MOD_disp);\n// MOD_disp=MOD_disp*MOD_disp*MOD_disp;\n\n// #ifdef MOD_FLIP_Y\n//     MOD_mask.y=1.0-MOD_mask.y;\n// #endif\n// #ifdef MOD_FLIP_X\n//     MOD_mask.x=1.0-MOD_mask.x;\n// #endif\n// #ifdef MOD_FLIP_XY\n//     MOD_mask.xy=1.0-MOD_mask.xy;\n// #endif\n\n\n\n#ifdef MOD_MODE_DIV\n    pos.xyz/=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_MUL\n    pos.xyz*=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_ADD\n    pos.xyz+=MOD_disp*MOD_mask;\n#endif\n\n#ifdef MOD_MODE_NORMAL\n\n    vec3 MOD_t=norm;\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_TANGENT\n    MOD_disp*=-1.0;\n\n    vec3 MOD_t=attrTangent;\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_BITANGENT\n    MOD_disp*=-1.0;\n    vec3 MOD_t=attrBiTangent;\n\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n#ifdef MOD_MODE_VERTCOL\n    vec3 MOD_t=attrVertColor.rgb*vec3(2.0)-vec3(1.0);\n\n    #ifdef MOD_SMOOTHSTEP\n        MOD_t=smoothstep(-1.,1.,MOD_t);\n    #endif\n\n    pos.xyz+=MOD_t*MOD_disp*MOD_mask;\n\n#endif\n\n\n// pos.y*=-1.0;\n    // pos.xy+=vec2(MOD_texVal*MOD_extrude)*normalize(pos.xy);\n\n\nMOD_displHeightMapColor=MOD_disp;\n\n\n#ifdef MOD_CALC_NORMALS\n    norm+=MOD_calcNormal(MOD_texture,MOD_tc);\n#endif","vertdisplace_head_vert":"OUT vec3 MOD_displHeightMapColor;\n\n#ifdef MOD_MODE_VERTCOL\n#ifndef VERTEX_COLORS\nIN vec4 attrVertColor;\n#endif\n#endif\n\n// mat4 rotationX( in float angle ) {\n// \treturn mat4(\t1.0,\t\t0,\t\t\t0,\t\t\t0,\n// \t\t\t \t\t0, \tcos(angle),\t-sin(angle),\t\t0,\n// \t\t\t\t\t0, \tsin(angle),\t cos(angle),\t\t0,\n// \t\t\t\t\t0, \t\t\t0,\t\t\t  0, \t\t1);\n// }\n\n// mat4 rotationY( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t0,\t\tsin(angle),\t0,\n// \t\t\t \t\t\t\t0,\t\t1.0,\t\t\t 0,\t0,\n// \t\t\t\t\t-sin(angle),\t0,\t\tcos(angle),\t0,\n// \t\t\t\t\t\t\t0, \t\t0,\t\t\t\t0,\t1);\n// }\n\n// mat4 rotationZ( in float angle ) {\n// \treturn mat4(\tcos(angle),\t\t-sin(angle),\t0,\t0,\n// \t\t\t \t\tsin(angle),\t\tcos(angle),\t\t0,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t1,\t0,\n// \t\t\t\t\t\t\t0,\t\t\t\t0,\t\t0,\t1);\n// }\n\n\nvec3 MOD_calcNormal(sampler2D tex,vec2 uv)\n{\n    float strength=13.0;\n    // float texelSize=1.0/float(textureSize(tex,0).x); // not on linux intel?!\n    float texelSize=1.0/512.0;\n\n    float tl = abs(texture(tex, uv + texelSize * vec2(-1.0, -1.0)).x);   // top left\n    float  l = abs(texture(tex, uv + texelSize * vec2(-1.0,  0.0)).x);   // left\n    float bl = abs(texture(tex, uv + texelSize * vec2(-1.0,  1.0)).x);   // bottom left\n    float  t = abs(texture(tex, uv + texelSize * vec2( 0.0, -1.0)).x);   // top\n    float  b = abs(texture(tex, uv + texelSize * vec2( 0.0,  1.0)).x);   // bottom\n    float tr = abs(texture(tex, uv + texelSize * vec2( 1.0, -1.0)).x);   // top right\n    float  r = abs(texture(tex, uv + texelSize * vec2( 1.0,  0.0)).x);   // right\n    float br = abs(texture(tex, uv + texelSize * vec2( 1.0,  1.0)).x);   // bottom right\n\n    //     // Compute dx using Sobel:\n    //     //           -1 0 1\n    //     //           -2 0 2\n    //     //           -1 0 1\n    float dX = tr + 2.0*r + br -tl - 2.0*l - bl;\n\n    //     // Compute dy using Sobel:\n    //     //           -1 -2 -1\n    //     //            0  0  0\n    //     //            1  2  1\n    float dY = bl + 2.0*b + br -tl - 2.0*t - tr;\n\n    //     // Build the normalized normal\n\nvec3 N;\n\n#ifdef MOD_NORMALS_Z\n    N = normalize(vec3(dX,dY, 1.0 / strength));\n#endif\n\n#ifdef MOD_NORMALS_Y\n    N = normalize(vec3(dX,1.0/strength,dY));\n#endif\n#ifdef MOD_NORMALS_X\n    N = normalize(vec3(1.0/strength,dX,dY));\n#endif\n// N*=-1.0;\n// N= N * 0.5 + 0.5;\n\n\n   return N;\n}\n",};
const
    render = op.inTrigger("Render"),
    extrude = op.inValue("Extrude", 0.5),
    meth = op.inSwitch("Mode", ["Norm", "Tang", "BiTang", "VertCol", "*", "+", "/"], "Norm"),
    axis = op.inSwitch("Axis", ["XYZ", "XY", "X", "Y", "Z"], "XYZ"),
    src = op.inSwitch("Coordinates", ["Tex Coords", "Mesh XY", "Mesh XZ"], "Tex Coords"),

    texture = op.inTexture("Texture", null, "texture"),
    channel = op.inSwitch("Channel", ["Luminance", "R", "G", "B", "A", "RGB"], "Luminance"),
    flip = op.inSwitch("Flip", ["None", "X", "Y", "XY"], "None"),
    range = op.inSwitch("Range", ["0-1", "1-0", "Normalized"], "0-1"),
    offsetX = op.inValueFloat("Offset X"),
    offsetY = op.inValueFloat("Offset Y"),
    scale = op.inValueFloat("Scale", 1),

    calcNormals = op.inValueBool("Calc Normals", false),
    calcNormalsAxis = op.inSwitch("Normal Axis", ["X", "Y", "Z"], "Z"),
    removeZero = op.inValueBool("Discard Zero Values"),
    colorize = op.inValueBool("colorize", false),
    colorizeMin = op.inValueSlider("Colorize Min", 0),
    colorizeMax = op.inValueSlider("Colorize Max", 1),
    next = op.outTrigger("trigger");

const cgl = op.patch.cgl;

op.setPortGroup("Input", [texture, flip, channel, range, offsetX, offsetY, scale]);
op.setPortGroup("Colorize", [colorize, colorizeMin, colorizeMax, removeZero]);

op.toWorkPortsNeedToBeLinked(texture, next, render);

render.onTriggered = dorender;

channel.onChange =
    src.onChange =
    axis.onChange =
    flip.onChange =
    meth.onChange =
    range.onChange =
    colorize.onChange =
    removeZero.onChange =
    calcNormals.onChange =
    calcNormalsAxis.onChange = updateDefines;

const srcHeadVert = attachments.vertdisplace_head_vert;
const srcBodyVert = attachments.vertdisplace_body_vert;

const srcHeadFrag = ""
    .endl() + "IN vec3 MOD_displHeightMapColor;"
    .endl() + "vec3 MOD_map(vec3 value, float inMin, float inMax, float outMin, float outMax) { return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);}"

    .endl();

const srcBodyFrag = ""
    .endl() + "#ifdef MOD_HEIGHTMAP_COLORIZE"
    .endl() + "   col.rgb*=MOD_map( MOD_displHeightMapColor, 0.0,1.0 , MOD_colorizeMin,MOD_colorizeMax);"
    .endl() + "#endif"
    .endl() + "#ifdef MOD_DISPLACE_REMOVE_ZERO"
    .endl() + "   if(MOD_displHeightMapColor.r==0.0)discard;"
    .endl() + "#endif"
    .endl();

const mod = new CGL.ShaderModifier(cgl, op.name, { "opId": op.id });
mod.addModule({
    "title": op.name,
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": srcHeadVert,
    "srcBodyVert": srcBodyVert
});

mod.addModule({
    "title": op.name,
    "name": "MODULE_COLOR",
    "srcHeadFrag": srcHeadFrag,
    "srcBodyFrag": srcBodyFrag
});

mod.addUniformVert("t", "MOD_texture", 0);
mod.addUniformVert("f", "MOD_extrude", extrude);
mod.addUniformVert("f", "MOD_offsetX", offsetX);
mod.addUniformVert("f", "MOD_offsetY", offsetY);
mod.addUniformVert("f", "MOD_scale", scale);

mod.addUniformFrag("f", "MOD_colorizeMin", colorizeMin);
mod.addUniformFrag("f", "MOD_colorizeMax", colorizeMax);

updateDefines();

function updateDefines()
{
    mod.toggleDefine("MOD_HEIGHTMAP_COLORIZE", colorize.get());

    mod.toggleDefine("MOD_HEIGHTMAP_INVERT", range.get() == "1-0");
    mod.toggleDefine("MOD_HEIGHTMAP_NORMALIZE", range.get() == "Normalized");

    mod.toggleDefine("MOD_DISPLACE_REMOVE_ZERO", removeZero.get());

    mod.toggleDefine("MOD_INPUT_R", channel.get() == "R");
    mod.toggleDefine("MOD_INPUT_G", channel.get() == "G");
    mod.toggleDefine("MOD_INPUT_B", channel.get() == "B");
    mod.toggleDefine("MOD_INPUT_A", channel.get() == "A");
    mod.toggleDefine("MOD_INPUT_RGB", channel.get() == "RGB");
    mod.toggleDefine("MOD_INPUT_LUMI", channel.get() == "Luminance");

    mod.toggleDefine("MOD_FLIP_X", flip.get() == "X");
    mod.toggleDefine("MOD_FLIP_Y", flip.get() == "Y");
    mod.toggleDefine("MOD_FLIP_XY", flip.get() == "XY");

    mod.toggleDefine("MOD_AXIS_X", axis.get() == "X");
    mod.toggleDefine("MOD_AXIS_Y", axis.get() == "Y");
    mod.toggleDefine("MOD_AXIS_Z", axis.get() == "Z");
    mod.toggleDefine("MOD_AXIS_XYZ", axis.get() == "XYZ");
    mod.toggleDefine("MOD_AXIS_XY", axis.get() == "XY");

    mod.toggleDefine("MOD_MODE_BITANGENT", meth.get() == "BiTang");
    mod.toggleDefine("MOD_MODE_TANGENT", meth.get() == "Tang");
    mod.toggleDefine("MOD_MODE_NORMAL", meth.get() == "Norm");
    mod.toggleDefine("MOD_MODE_VERTCOL", meth.get() == "VertCol");
    mod.toggleDefine("MOD_MODE_MUL", meth.get() == "*");
    mod.toggleDefine("MOD_MODE_ADD", meth.get() == "+");
    mod.toggleDefine("MOD_MODE_DIV", meth.get() == "/");
    mod.toggleDefine("MOD_SMOOTHSTEP", 0);

    mod.toggleDefine("MOD_COORD_TC", src.get() == "Tex Coords");
    mod.toggleDefine("MOD_COORD_MESHXY", src.get() == "Mesh XY");
    mod.toggleDefine("MOD_COORD_MESHXZ", src.get() == "Mesh XZ");

    mod.toggleDefine("MOD_CALC_NORMALS", calcNormals.get());
    mod.toggleDefine("MOD_NORMALS_X", calcNormalsAxis.get() == "X");
    mod.toggleDefine("MOD_NORMALS_Y", calcNormalsAxis.get() == "Y");
    mod.toggleDefine("MOD_NORMALS_Z", calcNormalsAxis.get() == "Z");

    calcNormalsAxis.setUiAttribs({ "greyout": !calcNormals.get() });
}

function dorender()
{
    mod.bind();

    if (texture.get() && !texture.get().deleted) mod.pushTexture("MOD_texture", texture.get());
    else mod.pushTexture("MOD_texture", CGL.Texture.getEmptyTexture(cgl));

    next.trigger();

    mod.unbind();
}


};

Ops.Gl.ShaderEffects.VertexDisplacementMap_v4.prototype = new CABLES.Op();
CABLES.OPS["ed36e5ad-457b-4ac6-a929-11b66951cb6c"]={f:Ops.Gl.ShaderEffects.VertexDisplacementMap_v4,objName:"Ops.Gl.ShaderEffects.VertexDisplacementMap_v4"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Noise.FBMNoise_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.Noise.FBMNoise_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"fbmnoise_frag":"UNI sampler2D tex;\nUNI float anim;\n\nUNI float scale;\nUNI float repeat;\n\nUNI float scrollX;\nUNI float scrollY;\n\nUNI float amount;\n\nUNI bool layer1;\nUNI bool layer2;\nUNI bool layer3;\nUNI bool layer4;\nUNI vec3 color;\nUNI float aspect;\n\nIN vec2 texCoord;\n\n\n{{CGL.BLENDMODES3}}\n\n// csdcsdcds\n// adapted from warp shader by inigo quilez/iq\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n// See here for a tutorial on how to make this: http://www.iquilezles.org/www/articles/warp/warp.htm\n\nconst mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );\n\nfloat noise( in vec2 x )\n{\n\treturn sin(1.5*x.x)*sin(1.5*x.y);\n}\n\nfloat fbm4( vec2 p )\n{\n    float f = 0.0;\n    f += 0.5000*noise( p ); p = m*p*2.02;\n    f += 0.2500*noise( p ); p = m*p*2.03;\n    f += 0.1250*noise( p ); p = m*p*2.01;\n    f += 0.0625*noise( p );\n    return f/0.9375;\n}\n\nfloat fbm6( vec2 p )\n{\n    float f = 0.0;\n    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;\n    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;\n    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;\n    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;\n    f += 0.015625*(0.5+0.5*noise( p ));\n    return f/0.96875;\n}\n\nvoid main()\n{\n    vec2 tc=texCoord;\n\t#ifdef DO_TILEABLE\n\t    tc=abs(texCoord-0.5);\n\t#endif\n\n    vec2 p=(tc-0.5)*scale;\n\n    p.y/=aspect;\n    vec2 q = vec2( fbm4( p + vec2(0.3+scrollX,0.20+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q2 = vec2( fbm4( p + vec2(2.0+scrollX,1.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,1.3+scrollY) ) );\n\n    vec2 q3 = vec2( fbm4( p + vec2(9.0+scrollX,4.0+scrollY) ),\n                   fbm4( p + vec2(3.1+scrollX,4.3+scrollY) ) );\n\n    float v= fbm4( ( p + 4.0*q +anim*0.1)*repeat);\n    float v2= fbm4( (p + 4.0*q2 +anim*0.1)*repeat );\n\n    float v3= fbm6( (p + 4.0*q3 +anim*0.1)*repeat );\n    float v4= fbm6( (p + 4.0*q2 +anim*0.1)*repeat );\n\n    vec4 base=texture(tex,texCoord);\n\n    vec4 finalColor;\n    float colVal=0.0;\n    float numLayers=0.0;\n\n    if(layer1)\n    {\n        colVal+=v;\n        numLayers++;\n    }\n\n    if(layer2)\n    {\n        colVal+=v2;\n        numLayers++;\n    }\n\n    if(layer3)\n    {\n        colVal+=v3;\n        numLayers++;\n    }\n\n    if(layer4)\n    {\n        colVal+=v4;\n        numLayers++;\n    }\n\n    finalColor=vec4( color*vec3(colVal/numLayers),1.0);\n\n    outColor = cgl_blendPixel(base,finalColor,amount);\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),
    r = op.inValueSlider("r", 1.0),
    g = op.inValueSlider("g", 1.0),
    b = op.inValueSlider("b", 1.0),
    trigger = op.outTrigger("trigger");

r.setUiAttribs({ "colorPick": true });

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "fbmnoise");

shader.setSource(shader.getDefaultVertexShader(), attachments.fbmnoise_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    uniScale = new CGL.Uniform(shader, "f", "scale", op.inValue("scale", 2)),
    uniAnim = new CGL.Uniform(shader, "f", "anim", op.inValue("anim", 0)),
    uniScrollX = new CGL.Uniform(shader, "f", "scrollX", op.inValue("scrollX", 9)),
    uniScrollY = new CGL.Uniform(shader, "f", "scrollY", op.inValue("scrollY", 0)),
    uniRepeat = new CGL.Uniform(shader, "f", "repeat", op.inValue("repeat", 1)),
    uniAspect = new CGL.Uniform(shader, "f", "aspect", op.inValue("aspect", 1)),
    uniLayer1 = new CGL.Uniform(shader, "b", "layer1", op.inValueBool("Layer 1", true)),
    uniLayer2 = new CGL.Uniform(shader, "b", "layer2", op.inValueBool("Layer 2", true)),
    uniLayer3 = new CGL.Uniform(shader, "b", "layer3", op.inValueBool("Layer 3", true)),
    uniLayer4 = new CGL.Uniform(shader, "b", "layer4", op.inValueBool("Layer 4", true)),
    uniColor = new CGL.Uniform(shader, "3f", "color", r, g, b),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

const tile = op.inValueBool("Tileable", false);
tile.onChange = updateTileable;

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

function updateTileable()
{
    shader.toggleDefine("DO_TILEABLE", tile.get());
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    uniAspect.set(cgl.currentTextureEffect.getCurrentSourceTexture().width / cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.Noise.FBMNoise_v2.prototype = new CABLES.Op();
CABLES.OPS["9422eeab-b6c5-47d1-8737-d5c43dc137a3"]={f:Ops.Gl.ImageCompose.Noise.FBMNoise_v2,objName:"Ops.Gl.ImageCompose.Noise.FBMNoise_v2"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ImageCompose_v4
// 
// **************************************************************

Ops.Gl.ImageCompose.ImageCompose_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"imgcomp_frag":"IN vec2 texCoord;\nUNI vec4 bgColor;\nUNI sampler2D tex;\n#ifdef USE_UVTEX\nUNI sampler2D UVTex;\n#endif\n\nvoid main()\n{\n\n    #ifndef USE_TEX\n        outColor=bgColor;\n    #endif\n    #ifdef USE_TEX\n        #ifndef USE_UVTEX\n        outColor=texture(tex,texCoord);\n        #else\n        outColor=texture(tex,texture(UVTex,texCoord).xy);\n        #endif\n    #endif\n\n\n\n}\n",};
const
    cgl = op.patch.cgl,
    render = op.inTrigger("Render"),
    inTex = op.inTexture("Base Texture"),
    inUVTex = op.inTexture("UV Texture"),
    inSize = op.inSwitch("Size", ["Auto", "Canvas", "Manual"], "Auto"),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    inFilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    inWrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    aniso = op.inSwitch("Anisotropic", ["0", "1", "2", "4", "8", "16"], "0"),

    inPixelFormat = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),

    r = op.inValueSlider("R", 0),
    g = op.inValueSlider("G", 0),
    b = op.inValueSlider("B", 0),
    a = op.inValueSlider("A", 0),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out", CGL.Texture.getEmptyTexture(cgl)),
    outRatio = op.outNumber("Aspect Ratio"),
    outWidth = op.outNumber("Texture Width"),
    outHeight = op.outNumber("Texture Height");

op.setPortGroup("Texture Size", [inSize, width, height]);
op.setPortGroup("Texture Parameters", [inWrap, aniso, inFilter, inPixelFormat]);

r.setUiAttribs({ "colorPick": true });
op.setPortGroup("Color", [r, g, b, a]);

op.toWorkPortsNeedToBeLinked(render);

const prevViewPort = [0, 0, 0, 0];
let effect = null;
let tex = null;
let reInitEffect = true;
let isFloatTex = false;
let copyShader = null;
let copyShaderTexUni = null;
let copyShaderUVTexUni = null;
let copyShaderRGBAUni = null;

inWrap.onChange =
inFilter.onChange =
aniso.onChange =
inPixelFormat.onChange = reInitLater;

inTex.onLinkChanged =
inSize.onChange =
inUVTex.onChange = updateUi;

render.onTriggered =
    op.preRender = doRender;

updateUi();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();
    tex = null;
    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": CGL.Texture.isPixelFormatFloat(inPixelFormat.get()), "name": op.name });

    const cgl_aniso = Math.min(cgl.maxAnisotropic, parseFloat(aniso.get()));

    tex = new CGL.Texture(cgl,
        {
            "anisotropic": cgl_aniso,
            "name": "image_compose_v2_" + op.id,
            "pixelFormat": inPixelFormat.get(),
            "filter": getFilter(),
            "wrap": getWrap(),
            "width": getWidth(),
            "height": getHeight()
        });

    effect.setSourceTexture(tex);

    outWidth.set(getWidth());
    outHeight.set(getHeight());
    outRatio.set(getWidth() / getHeight());

    texOut.set(CGL.Texture.getEmptyTexture(cgl));

    reInitEffect = false;
    updateUi();
}

function getFilter()
{
    if (inFilter.get() == "nearest") return CGL.Texture.FILTER_NEAREST;
    else if (inFilter.get() == "linear") return CGL.Texture.FILTER_LINEAR;
    else if (inFilter.get() == "mipmap") return CGL.Texture.FILTER_MIPMAP;
}

function getWrap()
{
    if (inWrap.get() == "repeat") return CGL.Texture.WRAP_REPEAT;
    else if (inWrap.get() == "mirrored repeat") return CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (inWrap.get() == "clamp to edge") return CGL.Texture.WRAP_CLAMP_TO_EDGE;
}

function getWidth()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().width;
    else if (inSize.get() == "Auto" || inSize.get() == "Canvas") return cgl.canvasWidth;
    else if (inSize.get() == "ViewPort") return cgl.getViewPort()[2];
    return Math.ceil(width.get());
}

function getHeight()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().height;
    else if (inSize.get() == "Auto" || inSize.get() == "Canvas") return cgl.canvasHeight;
    else if (inSize.get() == "ViewPort") return cgl.getViewPort()[3];
    else return Math.ceil(height.get());
}

function reInitLater()
{
    reInitEffect = true;
}

function updateResolution()
{
    if ((
        getWidth() != tex.width ||
        getHeight() != tex.height ||
        // tex.anisotropic != parseFloat(aniso.get()) ||
        // tex.isFloatingPoint() != CGL.Texture.isPixelFormatFloat(inPixelFormat.get()) ||
        tex.pixelFormat != inPixelFormat.get() ||
        tex.filter != getFilter() ||
        tex.wrap != getWrap()
    ) && (getWidth() !== 0 && getHeight() !== 0))
    {
        initEffect();
        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
        updateResolutionInfo();
        checkTypes();
    }
}

function updateResolutionInfo()
{
    let info = null;

    if (inSize.get() == "Manual")
    {
        info = null;
    }
    else if (inSize.get() == "Auto")
    {
        if (inTex.get()) info = "Input Texture";
        else info = "Canvas Size";

        info += ": " + getWidth() + " x " + getHeight();
    }

    let changed = false;
    changed = inSize.uiAttribs.info != info;
    inSize.setUiAttribs({ "info": info });
    if (changed)op.refreshParams();
}

function updateDefines()
{
    if (copyShader)copyShader.toggleDefine("USE_TEX", inTex.isLinked());
    if (copyShader)copyShader.toggleDefine("USE_UVTEX", inUVTex.isLinked());
}

function updateUi()
{
    aniso.setUiAttribs({ "greyout": getFilter() != CGL.Texture.FILTER_MIPMAP });

    r.setUiAttribs({ "greyout": inTex.isLinked() });
    b.setUiAttribs({ "greyout": inTex.isLinked() });
    g.setUiAttribs({ "greyout": inTex.isLinked() });
    a.setUiAttribs({ "greyout": inTex.isLinked() });

    width.setUiAttribs({ "greyout": inSize.get() != "Manual" });
    height.setUiAttribs({ "greyout": inSize.get() != "Manual" });

    // width.setUiAttribs({ "hideParam": inSize.get() != "Manual" });
    // height.setUiAttribs({ "hideParam": inSize.get() != "Manual" });

    if (tex)
        if (CGL.Texture.isPixelFormatFloat(inPixelFormat.get()) && getFilter() == CGL.Texture.FILTER_MIPMAP) op.setUiError("fpmipmap", "Don't use mipmap and 32bit at the same time, many systems do not support this.");
        else op.setUiError("fpmipmap", null);

    updateResolutionInfo();
    updateDefines();
    checkTypes();
}

function checkTypes()
{
    if (tex)
        if (inTex.isLinked() && inTex.get() && (tex.isFloatingPoint() != inTex.get().isFloatingPoint()))
            op.setUiError("textypediff", "Warning: Mixing floating point and non floating point texture can result in data/precision loss", 1);
        else
            op.setUiError("textypediff", null);
}

op.preRender = () =>
{
    doRender();
};

function copyTexture()
{
    if (!copyShader)
    {
        copyShader = new CGL.Shader(cgl, "copytextureshader");
        copyShader.setSource(copyShader.getDefaultVertexShader(), attachments.imgcomp_frag);
        copyShaderTexUni = new CGL.Uniform(copyShader, "t", "tex", 0);
        copyShaderUVTexUni = new CGL.Uniform(copyShader, "t", "UVTex", 1);
        copyShaderRGBAUni = new CGL.Uniform(copyShader, "4f", "bgColor", r, g, b, a);
        updateDefines();
    }

    cgl.pushShader(copyShader);
    cgl.currentTextureEffect.bind();

    if (inTex.get()) cgl.setTexture(0, inTex.get().tex);
    if (inUVTex.get()) cgl.setTexture(1, inUVTex.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();
}

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.imgCompVer = 3;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    effect.startEffect(inTex.get() || CGL.Texture.getEmptyTexture(cgl, isFloatTex), true);
    copyTexture();

    trigger.trigger();

    cgl.pushViewPort(0, 0, width.get(), height.get());

    effect.endEffect();
    texOut.setRef(effect.getCurrentSourceTexture());

    cgl.popViewPort();

    cgl.popBlend();
    cgl.currentTextureEffect = oldEffect;
}


};

Ops.Gl.ImageCompose.ImageCompose_v4.prototype = new CABLES.Op();
CABLES.OPS["17212e2b-d692-464c-8f8d-2d511dd3410a"]={f:Ops.Gl.ImageCompose.ImageCompose_v4,objName:"Ops.Gl.ImageCompose.ImageCompose_v4"};




// **************************************************************
// 
// Ops.Ui.VizTexture
// 
// **************************************************************

Ops.Ui.VizTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"viztex_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI samplerCube cubeMap;\nUNI float width;\nUNI float height;\nUNI float type;\nUNI float time;\n\nfloat LinearizeDepth(float d,float zNear,float zFar)\n{\n    float z_n = 2.0 * d - 1.0;\n    return 2.0 * zNear / (zFar + zNear - z_n * (zFar - zNear));\n}\n\nvoid main()\n{\n    vec4 col=vec4(vec3(0.),0.0);\n\n    vec4 colTex=texture(tex,texCoord);\n\n\n\n    if(type==1.0)\n    {\n        vec4 depth=vec4(0.);\n        vec2 localST=texCoord;\n        localST.y = 1. - localST.y;\n\n        localST.t = mod(localST.t*3.,1.);\n        localST.s = mod(localST.s*4.,1.);\n\n        #ifdef WEBGL2\n            #define texCube texture\n        #endif\n        #ifdef WEBGL1\n            #define texCube textureCube\n        #endif\n\n//         //Due to the way my depth-cubeMap is rendered, objects to the -x,y,z side is projected to the positive x,y,z side\n//         //Inside where top/bottom is to be drawn?\n        if (texCoord.s*4.> 1. && texCoord.s*4.<2.)\n        {\n            //Bottom (-y) quad\n            if (texCoord.t*3. < 1.)\n            {\n                vec3 dir=vec3(localST.s*2.-1.,-1.,-localST.t*2.+1.);//Due to the (arbitrary) way I choose as up in my depth-viewmatrix, i her emultiply the latter coordinate with -1\n                depth = texCube(cubeMap, dir);\n            }\n            //top (+y) quad\n            else if (texCoord.t*3. > 2.)\n            {\n                vec3 dir=vec3(localST.s*2.-1.,1.,localST.t*2.-1.);//Get lower y texture, which is projected to the +y part of my cubeMap\n                depth = texCube(cubeMap, dir);\n            }\n            else//Front (-z) quad\n            {\n                vec3 dir=vec3(localST.s*2.-1.,-localST.t*2.+1.,1.);\n                depth = texCube(cubeMap, dir);\n            }\n        }\n//         //If not, only these ranges should be drawn\n        else if (texCoord.t*3. > 1. && texCoord.t*3. < 2.)\n        {\n            if (texCoord.x*4. < 1.)//left (-x) quad\n            {\n                vec3 dir=vec3(-1.,-localST.t*2.+1.,localST.s*2.-1.);\n                depth = texCube(cubeMap, dir);\n            }\n            else if (texCoord.x*4. < 3.)//right (+x) quad (front was done above)\n            {\n                vec3 dir=vec3(1,-localST.t*2.+1.,-localST.s*2.+1.);\n                depth = texCube(cubeMap, dir);\n            }\n            else //back (+z) quad\n            {\n                vec3 dir=vec3(-localST.s*2.+1.,-localST.t*2.+1.,-1.);\n                depth = texCube(cubeMap, dir);\n            }\n        }\n        // colTex = vec4(vec3(depth),1.);\n        colTex = vec4(depth);\n    }\n\n    if(type==2.0)\n    {\n       float near = 0.1;\n       float far = 50.;\n       float depth = LinearizeDepth(colTex.r, near, far);\n       colTex.rgb = vec3(depth);\n    }\n\n\n\n\n    #ifdef ANIM_RANGE\n\n        if(colTex.r>1.0 || colTex.r<0.0)\n            colTex.r=mod(colTex.r,1.0)*0.5+(sin(colTex.r+mod(colTex.r*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n        if(colTex.g>1.0 || colTex.g<0.0)\n            colTex.g=mod(colTex.g,1.0)*0.5+(sin(colTex.g+mod(colTex.g*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n        if(colTex.b>1.0 || colTex.b<0.0)\n            colTex.b=mod(colTex.b,1.0)*0.5+(sin(colTex.b+mod(colTex.b*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n\n    #endif\n\n\n    // #ifdef ANIM_RANGE\n    //     if(colTex.r>1.0 || colTex.r<0.0)\n    //     {\n    //         float r=mod( time+colTex.r,1.0)*0.5+0.5;\n    //         colTex.r=r;\n    //     }\n    //     if(colTex.g>1.0 || colTex.g<0.0)\n    //     {\n    //         float r=mod( time+colTex.g,1.0)*0.5+0.5;\n    //         colTex.g=r;\n    //     }\n    //     if(colTex.b>1.0 || colTex.b<0.0)\n    //     {\n    //         float r=mod( time+colTex.b,1.0)*0.5+0.5;\n    //         colTex.b=r;\n    //     }\n    // #endif\n\n    #ifdef MOD_RANGE\n        colTex.r=mod(colTex.r,1.0001);\n        colTex.g=mod(colTex.g,1.0001);\n        colTex.b=mod(colTex.b,1.0001);\n\n    #endif\n\n    #ifdef ALPHA_ONE\n        colTex.a=1.0;\n    #endif\n    #ifdef ALPHA_INV\n        colTex.a=1.0-colTex.a;\n    #endif\n\n    outColor = mix(col,colTex,colTex.a);\n}\n\n","viztex_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nOUT vec2 texCoord;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nvoid main()\n{\n    texCoord=vec2(attrTexCoord.x,1.0-attrTexCoord.y);\n    vec4 pos = vec4( vPosition, 1. );\n    mat4 mvMatrix=viewMatrix * modelMatrix;\n    gl_Position = projMatrix * mvMatrix * pos;\n}",};
const
    inTex = op.inTexture("Texture In"),
    inShowInfo = op.inBool("Show Info", false),
    inVizRange = op.inSwitch("Visualize outside 0-1", ["Off", "Anim", "Modulo"], "Anim"),
    inAlpha = op.inSwitch("Alpha", ["A", "1", "1-A"], "A"),
    inPickColor = op.inBool("Show Color", false),
    inX = op.inFloatSlider("X", 0.5),
    inY = op.inFloatSlider("Y", 0.5),
    outTex = op.outTexture("Texture Out"),
    outInfo = op.outString("Info");

op.setUiAttrib({ "height": 150, "resizable": true });

const timer = new CABLES.Timer();
let shader = null;
let fb = null;
let pixelReader = null;
let colorString = "";

inAlpha.onChange =
    inVizRange.onChange = updateDefines;

inPickColor.onChange = updateUi;
updateUi();

if (CABLES.UI)
{
    timer.play();
    op.checkMainloopExists();
}

function updateUi()
{
    inX.setUiAttribs({ "greyout": !inPickColor.get() });
    inY.setUiAttribs({ "greyout": !inPickColor.get() });
}

inTex.onChange = () =>
{
    const t = inTex.get();

    outTex.setRef(t);

    let title = "";

    if (inTex.get() && inTex.isLinked()) title = inTex.links[0].getOtherPort(inTex).name;

    op.setUiAttrib({ "extendTitle": title });
};

function updateDefines()
{
    if (!shader) return;

    shader.toggleDefine("MOD_RANGE", inVizRange.get() == "Modulo");
    shader.toggleDefine("ANIM_RANGE", inVizRange.get() == "Anim");
    shader.toggleDefine("ALPHA_INV", inAlpha.get() == "1-A");
    shader.toggleDefine("ALPHA_ONE", inAlpha.get() == "1");
    op.checkMainloopExists();
}

op.renderVizLayer = (ctx, layer) =>
{
    if (!inTex.isLinked()) return;
    if (!layer.useGl) return;

    const port = inTex;
    const texSlot = 5;
    const texSlotCubemap = texSlot + 1;

    const perf = CABLES.UI.uiProfiler.start("previewlayer texture");
    const cgl = port.op.patch.cgl;

    if (!this._emptyCubemap) this._emptyCubemap = CGL.Texture.getEmptyCubemapTexture(cgl);
    port.op.patch.cgl.profileData.profileTexPreviews++;

    const portTex = port.get() || CGL.Texture.getEmptyTexture(cgl);

    if (!this._mesh)
    {
        const geom = new CGL.Geometry("vizTexture rect");
        geom.vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];
        geom.texCoords = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0];
        geom.verticesIndices = [0, 1, 2, 3, 1, 2];
        this._mesh = new CGL.Mesh(cgl, geom);
    }
    if (!this._shader)
    {
        this._shader = new CGL.Shader(cgl, "glpreviewtex");
        this._shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
        this._shader.setSource(attachments.viztex_vert, attachments.viztex_frag);
        this._shaderTexUniform = new CGL.Uniform(this._shader, "t", "tex", texSlot);
        this._shaderTexCubemapUniform = new CGL.Uniform(this._shader, "tc", "cubeMap", texSlotCubemap);
        shader = this._shader;
        updateDefines();

        this._shaderTexUniformW = new CGL.Uniform(this._shader, "f", "width", portTex.width);
        this._shaderTexUniformH = new CGL.Uniform(this._shader, "f", "height", portTex.height);
        this._shaderTypeUniform = new CGL.Uniform(this._shader, "f", "type", 0);
        this._shaderTimeUniform = new CGL.Uniform(this._shader, "f", "time", 0);
    }

    cgl.pushPMatrix();
    const sizeTex = [portTex.width, portTex.height];
    const small = port.op.patch.cgl.canvasWidth > sizeTex[0] && port.op.patch.cgl.canvasHeight > sizeTex[1];

    if (small)
    {
        mat4.ortho(cgl.pMatrix, 0, port.op.patch.cgl.canvasWidth, port.op.patch.cgl.canvasHeight, 0, 0.001, 11);
    }
    else mat4.ortho(cgl.pMatrix, -1, 1, 1, -1, 0.001, 11);

    const oldTex = cgl.getTexture(texSlot);
    const oldTexCubemap = cgl.getTexture(texSlotCubemap);

    let texType = 0;
    if (portTex)
    {
        if (portTex.cubemap) texType = 1;
        if (portTex.textureType == CGL.Texture.TYPE_DEPTH) texType = 2;

        if (texType == 0 || texType == 2)
        {
            cgl.setTexture(texSlot, portTex.tex);
            cgl.setTexture(texSlotCubemap, this._emptyCubemap.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
        }
        else if (texType == 1)
        {
            cgl.setTexture(texSlotCubemap, portTex.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
        }

        timer.update();
        this._shaderTimeUniform.setValue(timer.get());

        this._shaderTypeUniform.setValue(texType);
        let s = [port.op.patch.cgl.canvasWidth, port.op.patch.cgl.canvasHeight];

        cgl.gl.clearColor(0, 0, 0, 0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        cgl.pushModelMatrix();
        if (small)
        {
            s = sizeTex;
            mat4.translate(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
            mat4.scale(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
        }
        this._mesh.render(this._shader);
        cgl.popModelMatrix();

        if (texType == 0) cgl.setTexture(texSlot, oldTex);
        if (texType == 1) cgl.setTexture(texSlotCubemap, oldTexCubemap);

        cgl.popPMatrix();
        cgl.resetViewPort();

        const sizeImg = [layer.width, layer.height];

        const stretch = false;
        // if (!stretch)
        // {
        if (portTex.width > portTex.height) sizeImg[1] = layer.width * sizeTex[1] / sizeTex[0];
        else
        {
            sizeImg[1] = layer.width * (sizeTex[1] / sizeTex[0]);

            if (sizeImg[1] > layer.height)
            {
                const r = layer.height / sizeImg[1];
                sizeImg[0] *= r;
                sizeImg[1] *= r;
            }
        }

        const scaledDown = sizeImg[0] > sizeTex[0] && sizeImg[1] > sizeTex[1];

        // ctx.imageSmoothingEnabled = !small || !scaledDown;
        ctx.imageSmoothingEnabled = true;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(layer.x, layer.y - 10, 10, 10);
        ctx.fillStyle = "#000000";
        ctx.fillRect(layer.x, layer.y - 10, 5, 5);
        ctx.fillRect(layer.x + 5, layer.y - 10 + 5, 5, 5);

        let layerHeight = layer.height;
        let numX = (10 * layer.width / layerHeight);
        let stepY = (layerHeight / 10);
        let stepX = (layer.width / numX);
        for (let x = 0; x < numX; x++)
            for (let y = 0; y < 10; y++)
            {
                if ((x + y) % 2 == 0)ctx.fillStyle = "#333333";
                else ctx.fillStyle = "#393939";
                ctx.fillRect(layer.x + stepX * x, layer.y + stepY * y, stepX, stepY);
            }

        ctx.fillStyle = "#222";
        const borderLeft = (layer.width - sizeImg[0]) / 2;
        const borderTop = (layerHeight - sizeImg[1]) / 2;

        let imgPosX = layer.x + (layer.width - sizeImg[0]) / 2;
        let imgPosY = layer.y + (layerHeight - sizeImg[1]) / 2;
        let imgSizeW = sizeImg[0];
        let imgSizeH = sizeImg[1];

        if (layerHeight - sizeImg[1] < 0)
        {
            imgPosX = layer.x + (layer.width - sizeImg[0] * layerHeight / sizeImg[1]) / 2;
            imgPosY = layer.y;
            imgSizeW = sizeImg[0] * layerHeight / sizeImg[1];
            imgSizeH = layerHeight;
        }

        ctx.fillRect(layer.x, layer.y, imgPosX - layer.x, layerHeight);
        ctx.fillRect(layer.x + imgSizeW + imgPosX - layer.x, layer.y, imgSizeW, layerHeight);
        ctx.fillRect(layer.x, layer.y, layer.width, borderTop);
        ctx.fillRect(layer.x, layer.y + sizeImg[1] + borderTop, layer.width, borderTop);

        if (cgl.canvas && cgl.canvasWidth > 0 && cgl.canvasHeight > 0 && cgl.canvas.width > 0 && cgl.canvas.height > 0)
        {
            try
            {
                const bigPixels = imgSizeW / s[0] > 3 || imgSizeH / s[1] > 3;
                const veryBigPixels = imgSizeW / s[0] > 10 || imgSizeH / s[1] > 10;

                if (sizeTex[1] == 1)
                {
                    ctx.imageSmoothingEnabled = false;// workaround filtering problems
                    ctx.drawImage(cgl.canvas,
                        0,
                        0,
                        s[0],
                        s[1],
                        layer.x,
                        layer.y,
                        layer.width,
                        layerHeight);// workaround filtering problems
                    ctx.imageSmoothingEnabled = true;
                }
                else
                if (sizeTex[0] == 1)
                {
                    ctx.imageSmoothingEnabled = false;// workaround filtering problems
                    ctx.drawImage(cgl.canvas,
                        0,
                        0,
                        s[0],
                        s[1],
                        layer.x,
                        layer.y,
                        layer.width,
                        layerHeight);
                    ctx.imageSmoothingEnabled = true;
                }
                else
                if (sizeImg[0] != 0 && sizeImg[1] != 0 && layer.width != 0 && layerHeight != 0 && imgSizeW != 0 && imgSizeH != 0)
                {
                    ctx.imageSmoothingEnabled = !bigPixels;

                    ctx.drawImage(cgl.canvas,
                        0,
                        0,
                        s[0],
                        s[1],
                        imgPosX,
                        imgPosY,
                        imgSizeW,
                        imgSizeH);
                }

                if (veryBigPixels)
                {
                    const stepx = imgSizeW / s[0];
                    const stepy = imgSizeH / s[1];

                    ctx.imageSmoothingEnabled = true;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();

                    for (let x = 0; x <= s[0]; x++)
                    {
                        ctx.moveTo(imgPosX + x * stepx, imgPosY);
                        ctx.lineTo(imgPosX + x * stepx, imgPosY + imgSizeH);
                    }

                    for (let y = 0; y <= s[1]; y++)
                    {
                        ctx.moveTo(imgPosX, imgPosY + y * stepy);
                        ctx.lineTo(imgPosX + imgSizeW, imgPosY + y * stepy);
                    }

                    ctx.strokeStyle = "#555";
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            catch (e)
            {
                console.error("canvas drawimage exception...", e);
            }
            // }
        }

        let info = "";

        if (inShowInfo.get())
        {
            if (port.get() && port.get().getInfoOneLine) info += port.get().getInfoOneLine() + "\n";

        // ctx.save();
        // ctx.scale(layer.scale, layer.scale);
        // ctx.font = "normal 10px sourceCodePro";
        // ctx.fillStyle = "#000";
        // ctx.fillText(info, layer.x / layer.scale + 5 + 0.5, (layer.y + layer.height) / layer.scale - 5 + 0.5);
        // ctx.fillStyle = "#aaa";
        // ctx.fillText(info, layer.x / layer.scale + 5, (layer.y + layer.height) / layer.scale - 5);
        // ctx.restore();
        }

        if (inPickColor.get())
        {
            info += colorString + "\n";

            // ctx.save();
            // ctx.scale(layer.scale, layer.scale);
            // ctx.font = "normal 10px sourceCodePro";
            // ctx.fillStyle = "#000";
            // ctx.fillText("RGBA " + colorString, layer.x / layer.scale + 10 + 0.5, layer.y / layer.scale + 10 + 0.5);
            // ctx.fillStyle = "#aaa";
            // ctx.fillText("RGBA " + colorString, layer.x / layer.scale + 10, layer.y / layer.scale + 10);

            // ctx.restore();

            const x = imgPosX + imgSizeW * inX.get();
            const y = imgPosY + imgSizeH * inY.get();

            ctx.fillStyle = "#000";
            ctx.fillRect(
                x - 1,
                y - 10,
                3,
                20);

            ctx.fillRect(
                x - 10,
                y - 1,
                20,
                3);

            ctx.fillStyle = "#fff";
            ctx.fillRect(
                x - 1,
                y - 10,
                1,
                20);

            ctx.fillRect(
                x - 10,
                y - 1,
                20,
                1);
        }

        op.setUiAttrib({ "comment": info });
        outInfo.set(info);

        if (inPickColor.get())
        {
            const gl = cgl.gl;

            const realTexture = inTex.get();
            if (!realTexture)
            {
                colorString = "";
                return;
            }
            if (!fb) fb = gl.createFramebuffer();
            if (!pixelReader) pixelReader = new CGL.PixelReader();

            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, realTexture.tex, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            pixelReader.read(cgl, fb, realTexture.pixelFormat, inX.get() * realTexture.width, realTexture.height - inY.get() * realTexture.height, 1, 1, (pixel) =>
            {
                if (!CGL.Texture.isPixelFormatFloat(realTexture.pixelFormat))
                {
                    colorString = "Pixel Float: " + Math.floor(pixel[0] / 255 * 100) / 100;
                    if (!isNaN(pixel[1]))colorString += ", " + Math.floor(pixel[1] / 255 * 100) / 100;
                    if (!isNaN(pixel[2]))colorString += ", " + Math.floor(pixel[2] / 255 * 100) / 100;
                    if (!isNaN(pixel[3]))colorString += ", " + Math.floor(pixel[3] / 255 * 100) / 100;
                    colorString += "\n";

                    if (realTexture.pixelFormat.indexOf("ubyte") > 0)
                    {
                        colorString += "Pixel UByte: ";
                        colorString += Math.round(pixel[0]);
                        if (!isNaN(pixel[1]))colorString += ", " + Math.round(pixel[1]);
                        if (!isNaN(pixel[2]))colorString += ", " + Math.round(pixel[2]);
                        if (!isNaN(pixel[3]))colorString += ", " + Math.round(pixel[3]);

                        colorString += "\n";
                    }
                }
                else
                {
                    colorString = "Pixel Float: " + Math.round(pixel[0] * 100) / 100 + ", " + Math.round(pixel[1] * 100) / 100 + ", " + Math.round(pixel[2] * 100) / 100 + ", " + Math.round(pixel[3] * 100) / 100;
                    colorString += "\n";
                }
            });
        }
    }

    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    perf.finish();
};


};

Ops.Ui.VizTexture.prototype = new CABLES.Op();
CABLES.OPS["4ea2d7b0-ca74-45db-962b-4d1965ac20c0"]={f:Ops.Ui.VizTexture,objName:"Ops.Ui.VizTexture"};




// **************************************************************
// 
// Ops.Number.Number
// 
// **************************************************************

Ops.Number.Number = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    v = op.inValueFloat("value"),
    result = op.outNumber("result");

v.onChange = exec;

function exec()
{
    result.set(Number(v.get()));
}


};

Ops.Number.Number.prototype = new CABLES.Op();
CABLES.OPS["8fb2bb5d-665a-4d0a-8079-12710ae453be"]={f:Ops.Number.Number,objName:"Ops.Number.Number"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outNumber("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt, frameNum, deltaMs)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();
            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};


};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ToNormalMap_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.ToNormalMap_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"tonormal_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI vec2 size;\nUNI float strength;\nUNI float sizeMul;\n\nvoid main()\n{\n    float tl = abs(texture(tex, texCoord + (size*sizeMul) * vec2(-1.0, -1.0)).x);   // top left\n    float  l = abs(texture(tex, texCoord + (size*sizeMul) * vec2(-1.0,  0.0)).x);   // left\n    float bl = abs(texture(tex, texCoord + (size*sizeMul) * vec2(-1.0,  1.0)).x);   // bottom left\n    float  t = abs(texture(tex, texCoord + (size*sizeMul) * vec2( 0.0, -1.0)).x);   // top\n    float  b = abs(texture(tex, texCoord + (size*sizeMul) * vec2( 0.0,  1.0)).x);   // bottom\n    float tr = abs(texture(tex, texCoord + (size*sizeMul) * vec2( 1.0, -1.0)).x);   // top right\n    float  r = abs(texture(tex, texCoord + (size*sizeMul) * vec2( 1.0,  0.0)).x);   // right\n    float br = abs(texture(tex, texCoord + (size*sizeMul) * vec2( 1.0,  1.0)).x);   // bottom right\n\n    // Compute dx using Sobel:\n    //           -1 0 1\n    //           -2 0 2\n    //           -1 0 1\n    float dX = tr + 2.0*r + br -tl - 2.0*l - bl;\n\n    // Compute dy using Sobel:\n    //           -1 -2 -1\n    //            0  0  0\n    //            1  2  1\n    float dY = bl + 2.0*b + br -tl - 2.0*t - tr;\n\n    // Build the normalized normal\n    vec4 N = vec4(normalize(vec3(dX,dY, 1.0 / strength)), 1.0);\n    N= N * 0.5 + 0.5;\n    outColor= N;\n}",};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    strength = op.inValue("Strength", 4),
    sizeMul = op.inValue("Step Multiplier", 1);

const
    cgl = op.patch.cgl,
    shader = new CGL.Shader(cgl, op.name, op);

// from: https://forum.openframeworks.cc/t/compute-normal-map-from-image/1400/11
shader.setSource(shader.getDefaultVertexShader(), attachments.tonormal_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    uniStrength = new CGL.Uniform(shader, "f", "strength", strength),
    unisizeMul = new CGL.Uniform(shader, "f", "sizeMul", sizeMul),
    uniSize = new CGL.Uniform(shader, "2f", "size", 0, 0);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    const effectTex = cgl.currentTextureEffect.getCurrentSourceTexture();
    uniSize.setValue([1 / effectTex.width, 1 / effectTex.height]);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, effectTex.tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.ImageCompose.ToNormalMap_v2.prototype = new CABLES.Op();
CABLES.OPS["5dfb2856-b589-4bd9-8f4e-b518da115d11"]={f:Ops.Gl.ImageCompose.ToNormalMap_v2,objName:"Ops.Gl.ImageCompose.ToNormalMap_v2"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.PerlinAreaDeform_v4
// 
// **************************************************************

Ops.Gl.ShaderEffects.PerlinAreaDeform_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"perlindeform_vert":"vec3 MOD_newTangent,MOD_newBiTangent;\n\n#ifndef PERLINDEFORM\n#define PERLINDEFORM\nfloat Interpolation_C2( float x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }   //  6x^5-15x^4+10x^3\t( Quintic Curve.  As used by Perlin in Improved Noise.  http://mrl.nyu.edu/~perlin/paper445.pdf )\nvec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec3 Interpolation_C2( vec3 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2( vec4 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2_InterpAndDeriv( vec2 x ) { return x.xyxy * x.xyxy * ( x.xyxy * ( x.xyxy * ( x.xyxy * vec2( 6.0, 0.0 ).xxyy + vec2( -15.0, 30.0 ).xxyy ) + vec2( 10.0, -60.0 ).xxyy ) + vec2( 0.0, 30.0 ).xxyy ); }\nvec3 Interpolation_C2_Deriv( vec3 x ) { return x * x * (x * (x * 30.0 - 60.0) + 30.0); }\n\n\nvoid FAST32_hash_3D( \tvec3 gridcell,\n                        out vec4 lowz_hash_0,\n                        out vec4 lowz_hash_1,\n                        out vec4 lowz_hash_2,\n                        out vec4 highz_hash_0,\n                        out vec4 highz_hash_1,\n                        out vec4 highz_hash_2\t)\t\t//\tgenerates 3 random numbers for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );\n    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell.zzz * ZINC.xyz ) );\n    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell_inc1.zzz * ZINC.xyz ) );\n    lowz_hash_0 = fract( P * lowz_mod.xxxx );\n    highz_hash_0 = fract( P * highz_mod.xxxx );\n    lowz_hash_1 = fract( P * lowz_mod.yyyy );\n    highz_hash_1 = fract( P * highz_mod.yyyy );\n    lowz_hash_2 = fract( P * lowz_mod.zzzz );\n    highz_hash_2 = fract( P * highz_mod.zzzz );\n}\n\n//\n//\tPerlin Noise 3D  ( gradient noise )\n//\tReturn value range of -1.0->1.0\n//\thttp://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg\n//\nfloat Perlin3D( vec3 P )\n{\n    //\testablish our grid cell and unit position\n    vec3 Pi = floor(P);\n    vec3 Pf = P - Pi;\n    vec3 Pf_min1 = Pf - 1.0;\n\n#if 1\n    //\n    //\tclassic noise.\n    //\trequires 3 random values per point.  with an efficent hash function will run faster than improved noise\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hashx0, hashy0, hashz0, hashx1, hashy1, hashz1;\n    FAST32_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n    //SGPP_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n\n    //\tcalculate the gradients\n    vec4 grad_x0 = hashx0 - 0.49999;\n    vec4 grad_y0 = hashy0 - 0.49999;\n    vec4 grad_z0 = hashz0 - 0.49999;\n    vec4 grad_x1 = hashx1 - 0.49999;\n    vec4 grad_y1 = hashy1 - 0.49999;\n    vec4 grad_z1 = hashz1 - 0.49999;\n    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );\n    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );\n\n#if 1\n    //\tClassic Perlin Interpolation\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    float final = dot( res0, blend2.zxzx * blend2.wwyy );\n    final *= 1.1547005383792515290182975610039;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/sqrt(0.75)\n    return final;\n#else\n    //\tClassic Perlin Surflet\n    //\thttp://briansharpe.wordpress.com/2012/03/09/modifications-to-classic-perlin-noise/\n    Pf *= Pf;\n    Pf_min1 *= Pf_min1;\n    vec4 vecs_len_sq = vec4( Pf.x, Pf_min1.x, Pf.x, Pf_min1.x ) + vec4( Pf.yy, Pf_min1.yy );\n    float final = dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf.zzzz ) ), grad_results_0 ) + dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf_min1.zzzz ) ), grad_results_1 );\n    final *= 2.3703703703703703703703703703704;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/cube(0.75)\n    return final;\n#endif\n\n#else\n    //\n    //\timproved noise.\n    //\trequires 1 random value per point.  Will run faster than classic noise if a slow hashing function is used\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hash_lowz, hash_highz;\n    FAST32_hash_3D( Pi, hash_lowz, hash_highz );\n    //BBS_hash_3D( Pi, hash_lowz, hash_highz );\n    //SGPP_hash_3D( Pi, hash_lowz, hash_highz );\n\n    //\n    //\t\"improved\" noise using 8 corner gradients.  Faster than the 12 mid-edge point method.\n    //\tKen mentions using diagonals like this can cause \"clumping\", but we'll live with that.\n    //\t[1,1,1]  [-1,1,1]  [1,-1,1]  [-1,-1,1]\n    //\t[1,1,-1] [-1,1,-1] [1,-1,-1] [-1,-1,-1]\n    //\n    hash_lowz -= 0.5;\n    vec4 grad_results_0_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_lowz );\n    hash_lowz = abs( hash_lowz ) - 0.25;\n    vec4 grad_results_0_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_lowz );\n    vec4 grad_results_0_2 = Pf.zzzz * sign( abs( hash_lowz ) - 0.125 );\n    vec4 grad_results_0 = grad_results_0_0 + grad_results_0_1 + grad_results_0_2;\n\n    hash_highz -= 0.5;\n    vec4 grad_results_1_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_highz );\n    hash_highz = abs( hash_highz ) - 0.25;\n    vec4 grad_results_1_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_highz );\n    vec4 grad_results_1_2 = Pf_min1.zzzz * sign( abs( hash_highz ) - 0.125 );\n    vec4 grad_results_1 = grad_results_1_0 + grad_results_1_1 + grad_results_1_2;\n\n    //\tblend the gradients and return\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    return dot( res0, blend2.zxzx * blend2.wwyy ) * (2.0 / 3.0);\t//\t(optionally) mult by (2.0/3.0) to scale to a strict -1.0->1.0 range\n#endif\n}\n\n#endif\n\nvec3 MOD_deform(vec3 pos,vec3 norm)\n{\n    vec3 modelPos=pos;\n    vec3 forcePos=vec3(MOD_x,MOD_y,MOD_z);\n\n    vec3 vecToOrigin=modelPos-forcePos;\n    float dist=abs(length(vecToOrigin));\n    // float distAlpha = (MOD_size - dist) / MOD_size;\n\n    if(dist*MOD_mScale<MOD_size*MOD_mScale)\n    {\n        vec3 ppos=vec3(pos*MOD_scale*MOD_mScale);\n        ppos.x+=MOD_scrollx;\n        ppos.y+=MOD_scrolly;\n        ppos.z+=MOD_scrollz;\n\n        float p=(Perlin3D(ppos))*MOD_strength;\n\n        float dist=distance(vec3(MOD_x,MOD_y,MOD_z),modelPos);\n        float fallOff=1.0-smoothstep(MOD_fallOff*MOD_size,MOD_size,dist);\n\n        vec3 pnorm=norm;//normalize(pos.xyz);\n\n        #ifdef MOD_METH_MULNORM\n            pos.x+=p*pnorm.x*fallOff;\n            pos.y+=p*pnorm.y*fallOff;\n            pos.z+=p*pnorm.z*fallOff;\n        #endif\n        #ifdef MOD_METH_MULNORM_Y\n            pos.y+=p*pnorm.y*fallOff;\n        #endif\n\n        #ifdef MOD_METH_MUL_Z\n            pos.z+=p*pos.z*fallOff;\n        #endif\n\n        #ifdef MOD_METH_MUL_XYZ\n            pos.x+=p*pos.x*fallOff;\n            pos.y+=p*pos.y*fallOff;\n            pos.z+=p*pos.z*fallOff;\n\n        #endif\n\n        #ifdef MOD_METH_ADD_XYZ\n            pos.x+=p*fallOff;\n            pos.y+=p*fallOff;\n            pos.z+=p*fallOff;\n        #endif\n\n        #ifdef MOD_METH_ADD_Z\n            pos.z+=p*fallOff;\n        #endif\n        #ifdef MOD_METH_ADD_Y\n            pos.y+=p*fallOff;\n        #endif\n        #ifdef MOD_METH_ADD_X\n            pos.x+=p*fallOff;\n        #endif\n    }\n\n    return pos;\n}\n\n// LOOK AT THIS./....\n//https://github.com/spite/perlin-experiments/blob/master/chrome.html\n\n\nvec3 MOD_calcNormal(vec3 pos,vec3 norm,vec3 tangent,vec3 bitangent)\n{\n    //http://diary.conewars.com/vertex-displacement-shader/\n    vec4 position=vec4(MOD_deform(pos,norm),1.0);\n\n    vec3 positionAndTangent = MOD_deform( pos + tangent * 0.1,norm );\n    vec3 positionAndBitangent = MOD_deform( pos + bitangent * 0.1,norm );\n\n    MOD_newTangent = ( positionAndTangent - position.xyz ); // leaves just 'tangent'\n    MOD_newBiTangent = ( positionAndBitangent - position.xyz ); // leaves just 'bitangent'\n\n    vec3 newNormal = cross( MOD_newTangent.xyz, MOD_newBiTangent.xyz );\n    return normalize(newNormal.xyz);\n\n}\n\n","perlindeform_body_vert":"\nvec4 MOD_p=pos;\n\n#ifdef POS_ATTR\n    MOD_p=vec4(vPosition,1.0);\n#endif\n\n#ifdef POS_MMATRIX\n    MOD_p=vec4(mMatrix[3][0],mMatrix[3][1],mMatrix[3][2],1.0);\n#endif\n\n#ifndef MOD_WORLDSPACE\n    pos.xyz=MOD_deform(MOD_p.xyz,norm.xyz);\n\n    #ifdef MOD_CALC_NORMALS\n        norm=MOD_calcNormal(MOD_p.xyz,norm.xyz,tangent,bitangent);\n    #endif\n#endif\n\n#ifdef MOD_WORLDSPACE\n    pos.xyz=MOD_deform( (mMatrix*MOD_p).xyz ,norm.xyz);\n\n    #ifdef MOD_CALC_NORMALS\n        norm=MOD_calcNormal( (mMatrix*MOD_p).xyz,norm.xyz,tangent,bitangent);\n    #endif\n#endif\n\n#ifdef MOD_CALC_NORMALS\n    tangent=MOD_newTangent;\n    bitangent=MOD_newBiTangent;\n#endif\n\n\n\n#ifdef MOD_FLIP_NORMALS\n    norm*=-1.0;\n#endif\n",};
const
    render = op.inTrigger("render"),
    next = op.outTrigger("trigger"),
    inScale = op.inValueFloat("Scale", 1),
    inSize = op.inValueFloat("Size", 1),
    inStrength = op.inValueFloat("Strength", 1),
    inCalcNormals = op.inValueBool("Calc Normals", false),
    inFlipNormals = op.inValueBool("Flip Normals", false),

    inFalloff = op.inValueSlider("Falloff", 0.5),
    output = op.inValueSelect("Output", ["Mul Normal", "Mul Z", "Mul XYZ",, "Mul Norm Y", "Add XYZ", "Add X", "Add Y", "Add Z"], "Add XYZ"),
    inPos = op.inSwitch("Source", ["Pos", "Orig Pos", "Model"], "Pos"),
    // inInstancer = op.inBool("For Instancing", false),
    x = op.inValueFloat("x"),
    y = op.inValueFloat("y"),
    z = op.inValueFloat("z"),
    scrollx = op.inValueFloat("Scroll X"),
    scrolly = op.inValueFloat("Scroll Y"),
    scrollz = op.inValueFloat("Scroll Z");

const cgl = op.patch.cgl;
const mod = new CGL.ShaderModifier(cgl, op.name, { "opId": op.id });

inFlipNormals.onChange =
inCalcNormals.onChange = updateCalcNormals;
const inWorldSpace = op.inValueBool("WorldSpace");

const moduleVert = null;
inPos.onChange =
    output.onChange = updateOutput;

const mscaleUni = null;
inWorldSpace.onChange = updateWorldspace;

mod.addModule({
    "priority": 6,
    "title": op.name,
    "name": "MODULE_VERTEX_POSITION",
    "srcHeadVert": attachments.perlindeform_vert,
    "srcBodyVert": attachments.perlindeform_body_vert
});

mod.addUniformVert("f", "MOD_size", inSize);
mod.addUniformVert("f", "MOD_strength", inStrength);
mod.addUniformVert("f", "MOD_scale", inScale);

mod.addUniformVert("f", "MOD_scrollx", scrollx);
mod.addUniformVert("f", "MOD_scrolly", scrolly);
mod.addUniformVert("f", "MOD_scrollz", scrollz);

mod.addUniformVert("f", "MOD_x", x);
mod.addUniformVert("f", "MOD_y", y);
mod.addUniformVert("f", "MOD_z", z);
mod.addUniformVert("f", "MOD_fallOff", inFalloff);

mod.addUniformVert("f", "MOD_mScale", 1);

updateOutput();
updateWorldspace();
updateCalcNormals();
// updatePrio();

// function updatePrio()
// {
//     let prio = 0;
//     if (inInstancer.get()) prio = -6;

//     mod.removeModule(op.name);

//     mod.addModule({
//         "priority": prio,
//         "title": op.name,
//         "name": "MODULE_VERTEX_POSITION",
//         "srcHeadVert": attachments.perlindeform_vert,
//         "srcBodyVert": attachments.perlindeform_body_vert
//     });

//     console.log("yeap",prio);
// }

function updateCalcNormals()
{
    mod.toggleDefine("MOD_FLIP_NORMALS", inFlipNormals.get());
    mod.toggleDefine("MOD_CALC_NORMALS", inCalcNormals.get());
}

function updateWorldspace()
{
    mod.toggleDefine("MOD_WORLDSPACE", inWorldSpace.get());
}

function updateOutput()
{
    mod.toggleDefine("POS_ATTR", inPos.get() == "Orig Pos");
    mod.toggleDefine("POS_MMATRIX", inPos.get() == "Model");

    mod.toggleDefine("MOD_METH_MUL_XYZ", output.get() == "Mul XYZ");
    mod.toggleDefine("MOD_METH_ADD_XYZ", output.get() == "Add XYZ");
    mod.toggleDefine("MOD_METH_ADD_Z", output.get() == "Add Z");
    mod.toggleDefine("MOD_METH_MUL_Z", output.get() == "Mul Z");
    mod.toggleDefine("MOD_METH_ADD_Y", output.get() == "Add Y");
    mod.toggleDefine("MOD_METH_ADD_X", output.get() == "Add X");
    mod.toggleDefine("MOD_METH_MULNORM", output.get() == "Mul Normal");
    mod.toggleDefine("MOD_METH_MULNORM_Y", output.get() == "Mul Norm Y");
}

function getScaling(mat)
{
    const m31 = mat[8];
    const m32 = mat[9];
    const m33 = mat[10];
    return Math.hypot(m31, m32, m33);
}

render.onTriggered = function ()
{
    if (!cgl.getShader())
    {
        next.trigger();
        return;
    }

    const modelScale = getScaling(cgl.mMatrix);
    if (mscaleUni)mscaleUni.setValue(modelScale);

    if (CABLES.UI)
    {
        cgl.pushModelMatrix();

        if (cgl.shouldDrawHelpers(op))
        {
            cgl.pushModelMatrix();
            mat4.translate(cgl.mMatrix, cgl.mMatrix, [x.get(), y.get(), z.get()]);
            CABLES.GL_MARKER.drawSphere(op, inSize.get());
            cgl.popModelMatrix();
        }

        if (op.isCurrentUiOp())
            gui.setTransformGizmo(
                {
                    "posX": x,
                    "posY": y,
                    "posZ": z
                });

        cgl.popModelMatrix();
    }

    mod.bind();
    next.trigger();
    mod.unbind();
};


};

Ops.Gl.ShaderEffects.PerlinAreaDeform_v4.prototype = new CABLES.Op();
CABLES.OPS["060ef3c1-bb79-46a5-9ec0-3272067fe504"]={f:Ops.Gl.ShaderEffects.PerlinAreaDeform_v4,objName:"Ops.Gl.ShaderEffects.PerlinAreaDeform_v4"};




// **************************************************************
// 
// Ops.Ui.VizGraph
// 
// **************************************************************

Ops.Ui.VizGraph = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    inNum1 = op.inFloat("Number 1"),
    inNum2 = op.inFloat("Number 2"),
    inNum3 = op.inFloat("Number 3"),
    inNum4 = op.inFloat("Number 4"),
    inNum5 = op.inFloat("Number 5"),
    inNum6 = op.inFloat("Number 6"),
    inNum7 = op.inFloat("Number 7"),
    inNum8 = op.inFloat("Number 8"),
    inReset = op.inTriggerButton("Reset");

op.setUiAttrib({ "height": 150, "resizable": true, "vizLayerMaxZoom": 2500 });

let buff = [];

let max = -Number.MAX_VALUE;
let min = Number.MAX_VALUE;

inNum1.onLinkChanged =
    inNum2.onLinkChanged =
    inNum3.onLinkChanged =
    inNum4.onLinkChanged =
    inNum5.onLinkChanged =
    inNum6.onLinkChanged =
    inNum7.onLinkChanged =
    inNum8.onLinkChanged =
    inReset.onTriggered = () =>
    {
        max = -Number.MAX_VALUE;
        min = Number.MAX_VALUE;
        buff = [];
    };

op.renderVizLayer = (ctx, layer) =>
{
    const perf = CABLES.UI.uiProfiler.start("previewlayer graph");

    const colors = [
        "#00ffff",
        "#ffff00",
        "#ff00ff",
        "#0000ff",
        "#00ff00",
        "#ff0000",
        "#ffffff",
        "#888888",
    ];

    ctx.fillStyle = "#222";
    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

    for (let p = 0; p < op.portsIn.length; p++)
    {
        if (!op.portsIn[p].isLinked()) continue;
        const newVal = op.portsIn[p].get();

        max = Math.max(op.portsIn[p].get(), max);
        min = Math.min(op.portsIn[p].get(), min);

        if (!buff[p]) buff[p] = [];
        buff[p].push(newVal);
        if (buff[p].length > 60) buff[p].shift();

        const texSlot = 5;
        const mulX = layer.width / 60;

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#555555";

        ctx.beginPath();
        ctx.moveTo(layer.x, CABLES.map(0, min, max, layer.height, 0) + layer.y);
        ctx.lineTo(layer.x + layer.width, CABLES.map(0, min, max, layer.height, 0) + layer.y);
        ctx.stroke();

        ctx.strokeStyle = colors[p];

        ctx.beginPath();

        for (let i = 0; i < buff[p].length; i++)
        {
            let y = buff[p][i];

            y = CABLES.map(y, min, max, layer.height, 0);
            y += layer.y;
            if (i === 0)ctx.moveTo(layer.x, y);
            else ctx.lineTo(layer.x + i * mulX, y);
        }

        ctx.stroke();
    }

    ctx.fillStyle = "#888";
    ctx.fillText("max:" + Math.round(max * 100) / 100, layer.x + 10, layer.y + layer.height - 10);
    ctx.fillText("min:" + Math.round(min * 100) / 100, layer.x + 10, layer.y + layer.height - 30);

    perf.finish();
};


};

Ops.Ui.VizGraph.prototype = new CABLES.Op();
CABLES.OPS["13c54eb4-60ef-4b9c-8425-d52a431f5c87"]={f:Ops.Ui.VizGraph,objName:"Ops.Ui.VizGraph"};




// **************************************************************
// 
// Ops.WebAudio.MicrophoneIn_v2
// 
// **************************************************************

Ops.WebAudio.MicrophoneIn_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const cgl = op.patch.cgl;

let microphone = null;
const audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

const inInit = op.inTriggerButton("Start");
const inInputDevices = op.inDropDown("Audio Input", ["None"]);
const inGain = op.inFloatSlider("Volume", 1);
const inMute = op.inBool("Mute", false);
const audioOut = op.outObject("Audio Out", null, "audioNode");
const recording = op.outBool("Listening", false);
const outDevices = op.outArray("List of Input Devices");

op.setPortGroup("Volume Settings", [inGain, inMute]);
let audioInputsLoaded = false;
let loadingId = null;

const gainNode = audioCtx.createGain();

function streamAudio(stream)
{
    microphone = audioCtx.createMediaStreamSource(stream);
    microphone.connect(gainNode);
    audioOut.set(gainNode);
    op.log("[microphoneIn] streaming mic audio!", stream, microphone);
    recording.set(true);
}

inGain.onChange = () =>
{
    if (inMute.get()) return;
    gainNode.gain.setValueAtTime(Number(inGain.get()) || 0, audioCtx.currentTime);
};

inMute.onChange = () =>
{
    if (inMute.get())
    {
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    }
    else
    {
        gainNode.gain.setValueAtTime(Number(inGain.get()) || 0, audioCtx.currentTime);
    }
};

inInit.onTriggered = function ()
{
    if (!audioCtx)
    {
        op.log("[microphoneIn] no audiocontext!");
        return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    {
        op.log("[microphoneIn] new micro");

        if (audioInputsLoaded)
        {
            op.setUiError("noAudioInputs", null);

            const device = inInputDevices.get();

            if (device === "None")
            {
                op.setUiError("noDeviceSelected", "No audio device selected!", 1);
                return;
            }
            else
            {
                op.setUiError("noDeviceSelected", null);
            }
            const constraints = {
                "audio": { "deviceId": device },
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then((stream) =>
                {
                    microphone = audioCtx.createMediaStreamSource(stream);
                    microphone.connect(gainNode);
                    audioOut.set(gainNode);
                    op.log("streaming mic audio!", stream, microphone, gainNode);
                    recording.set(true);
                    op.setUiError("devicesLoaded", null);
                })
                .catch((e) =>
                {
                    op.log("ERROR STREAMNG", e);
                });
        }
        else
        {
            op.setUiError("noAudioInputs", "There are no audio inputs to use the MicrophoneIn op with.", 2);
        }
    }
    else
    {
        // old method
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia || navigator.mozGetUserMedia);

        if (navigator.getUserMedia)
        {
            navigator.getUserMedia(
                { "audio": true },
                streamAudio,
                function (e)
                {
                    op.log("[microphoneIn]No live audio input " + e);
                    recording.set(false);
                }
            );
        }
        else
        {
            op.log("[op microphone] could not get usermedia");
            recording.set(false);
        }
    }
};

/* INIT FUNCTION */
loadingId = cgl.patch.loading.start("MIC inputs", "", op);
navigator.mediaDevices.getUserMedia({ "audio": true })
    .then((res) =>
    { return navigator.mediaDevices.enumerateDevices(); })
    .then((devices) =>
    {
        const audioInputDevices = devices
            .filter((device) => { return device.kind === "audioinput"; })
            .map((deviceInfo, index) => { return deviceInfo.label || `microphone ${index + 1}`; });

        inInputDevices.uiAttribs.values = audioInputDevices;
        op.setUiError("devicesLoaded", "Input devices have been loaded. Please choose a device from the dropdown menu and click the \"Start\" button to activate the microphone input.", 0);
        cgl.patch.loading.finished(loadingId);
        audioInputsLoaded = true;
        outDevices.set(null);
        outDevices.set(audioInputDevices);
    })
    .catch((e) =>
    {
        op.log("error", e);
        cgl.patch.loading.finished(loadingId);
        audioInputsLoaded = false;
    });


};

Ops.WebAudio.MicrophoneIn_v2.prototype = new CABLES.Op();
CABLES.OPS["cbfbbffd-a5a8-4b21-bcb5-5d031cc5e11a"]={f:Ops.WebAudio.MicrophoneIn_v2,objName:"Ops.WebAudio.MicrophoneIn_v2"};




// **************************************************************
// 
// Ops.WebAudio.AudioAnalyzer_v2
// 
// **************************************************************

Ops.WebAudio.AudioAnalyzer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const clamp = (val, min, max) => { return Math.min(Math.max(val, min), max); };
const MAX_DBFS_RANGE_24_BIT = -144;
const MAX_DBFS_RANGE_26_BIT = -96;

let audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

const inTrigger = op.inTrigger("Trigger In");

const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 256;

const FFT_BUFFER_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

const audioIn = op.inObject("Audio In", null, "audioNode");
const inFFTSize = op.inDropDown("FFT size", FFT_BUFFER_SIZES, 256);
const inSmoothing = op.inFloatSlider("Smoothing", 0.3);

const inRangeMin = op.inFloat("Min", -90);
const inRangeMax = op.inFloat("Max", 0);

op.setPortGroup("Inputs", [inTrigger, audioIn]);
op.setPortGroup("FFT Options", [inFFTSize, inSmoothing]);
op.setPortGroup("Range (in dBFS)", [inRangeMin, inRangeMax]);
const outTrigger = op.outTrigger("Trigger Out");
const audioOut = op.outObject("Audio Out", null, "audioNode");
const fftOut = op.outArray("FFT Array");
const ampOut = op.outArray("Waveform Array");
const frequencyOut = op.outArray("Frequencies by Index Array");
const fftLength = op.outNumber("Array Length");
const avgVolumePeak = op.outNumber("Average Volume");
const avgVolumeAmp = op.outNumber("Average Volume Time-Domain");
const avgVolumeRMS = op.outNumber("RMS Volume");
let updating = false;

let fftBufferLength = analyser.frequencyBinCount;
let fftDataArray = new Uint8Array(fftBufferLength);
let ampDataArray = new Uint8Array(fftBufferLength);
let frequencyArray = [];
frequencyArray.length = fftBufferLength;
let oldAudioIn = null;

audioIn.onChange = () =>
{
    if (audioIn.get())
    {
        const audioNode = audioIn.get();
        if (audioNode.connect)
        {
            audioNode.connect(analyser);
            audioOut.set(analyser);
        }
    }
    else
    {
        if (oldAudioIn)
        {
            if (oldAudioIn.disconnect) oldAudioIn.disconnect(analyser);
            audioOut.set(null);
        }
    }

    oldAudioIn = audioIn.get();
};

function updateAnalyser()
{
    try
    {
        const fftSize = Number(inFFTSize.get());
        analyser.smoothingTimeConstant = clamp(inSmoothing.get(), 0.0, 1.0);
        analyser.fftSize = fftSize;
        const minDecibels = clamp(inRangeMin.get(), MAX_DBFS_RANGE_24_BIT, -0.0001);
        const maxDecibels = Math.max(inRangeMax.get(), analyser.minDecibels + 0.0001);
        analyser.minDecibels = minDecibels;
        analyser.maxDecibels = maxDecibels;

        if (minDecibels < MAX_DBFS_RANGE_24_BIT)
        {
            op.setUiError("maxDbRangeMin",
                "Your minimum is below the lowest possible dBFS value: "
                + MAX_DBFS_RANGE_24_BIT
                + "dBFS. To make sure your analyser data is correct, try increasing the minimum.",
                1
            );
        }
        else
        {
            op.setUiError("maxDbRangeMin", null);
        }

        if (maxDecibels > 0)
        {
            op.setUiError("maxDbRangeMax", "Your maximum is above 0 dBFS. As digital signals only go to 0 dBFS and not above, you should use 0 as your maximum.", 1);
        }
        else
        {
            op.setUiError("maxDbRangeMax", null);
        }

        if (FFT_BUFFER_SIZES.indexOf(fftSize) >= 6)
        {
            op.setUiError("highFftSize", "Please be careful with high FFT sizes as they can slow down rendering. Check the profiler to see if performance is impacted.", 1);
        }
        else
        {
            op.setUiError("highFftSize", null);
        }
    }
    catch (e)
    {
        op.log(e);
    }
}

inFFTSize.onChange = inSmoothing.onChange
= inRangeMin.onChange = inRangeMax.onChange = () =>
    {
        if (inTrigger.isLinked()) updating = true;
        else updateAnalyser();
    };

inTrigger.onTriggered = function ()
{
    if (updating)
    {
        updateAnalyser();
        updating = false;
    }

    if (fftBufferLength != analyser.frequencyBinCount)
    {
        fftBufferLength = analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
        ampDataArray = new Uint8Array(fftBufferLength);

        frequencyArray = [];
        frequencyArray.length = fftBufferLength;

        for (let index = 0; index < fftBufferLength; index += 1)
        {
            frequencyArray[index] = Math.round(index * audioCtx.sampleRate / (analyser.fftSize * 2));
        }

        frequencyOut.set(null);
        frequencyOut.set(frequencyArray);
    }

    if (!fftDataArray) return;
    if (!ampDataArray) return;

    const fftSize = Number(inFFTSize.get());

    try
    {
        analyser.getByteFrequencyData(fftDataArray);
        analyser.getByteTimeDomainData(ampDataArray);

        let values = 0;
        let peakValues = 0;
        let ampPeakValues = 0;
        for (let i = 0; i < analyser.frequencyBinCount; i++)
        {
            values += ampDataArray[i] * ampDataArray[i];
            peakValues += fftDataArray[i];
            ampPeakValues += ampDataArray[i];
        }

        const peakAverage = peakValues / analyser.frequencyBinCount;
        const peakAmpAverage = ampPeakValues / analyser.frequencyBinCount;

        avgVolumePeak.set(peakAverage / 128);
        avgVolumeAmp.set(peakAmpAverage / 256);

        let rms = Math.sqrt(values / analyser.frequencyBinCount);
        rms = Math.max(rms, rms * inSmoothing.get());
        avgVolumeRMS.set(rms / 256);
    }
    catch (e) { op.log(e); }

    // fftOut.set(null);
    fftOut.setRef(fftDataArray);

    // ampOut.set(null);
    ampOut.setRef(ampDataArray);

    fftLength.set(fftDataArray.length);
    outTrigger.trigger();
};


};

Ops.WebAudio.AudioAnalyzer_v2.prototype = new CABLES.Op();
CABLES.OPS["ff9bf46c-676f-4aa1-95bf-5595a6813ed7"]={f:Ops.WebAudio.AudioAnalyzer_v2,objName:"Ops.WebAudio.AudioAnalyzer_v2"};




// **************************************************************
// 
// Ops.Sidebar.Sidebar
// 
// **************************************************************

Ops.Sidebar.Sidebar = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={"style_css":" /*\n * SIDEBAR\n  http://danielstern.ca/range.css/#/\n  https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-progress-value\n */\n\n.sidebar-icon-undo\n{\n    width:10px;\n    height:10px;\n    background-image: url(\"data:image/svg+xml;charset=utf8, %3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='grey' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 7v6h6'/%3E%3Cpath d='M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13'/%3E%3C/svg%3E\");\n    background-size: 19px;\n    background-repeat: no-repeat;\n    top: -19px;\n    margin-top: -7px;\n}\n\n.icon-chevron-down {\n    top: 2px;\n    right: 9px;\n}\n\n.iconsidebar-chevron-up,.sidebar__close-button {\n\tbackground-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n}\n\n.iconsidebar-minimizebutton {\n    background-position: 98% center;\n    background-repeat: no-repeat;\n}\n\n.sidebar-cables-right\n{\n    right: 15px;\n    left: initial !important;\n}\n\n.sidebar-cables *\n{\n    color: #BBBBBB !important;\n    font-family: Arial;\n}\n\n.sidebar-cables {\n    --sidebar-color: #07f78c;\n    --sidebar-width: 220px;\n    --sidebar-border-radius: 10px;\n    --sidebar-monospace-font-stack: \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace;\n    --sidebar-hover-transition-time: .2s;\n\n    position: absolute;\n    top: 15px;\n    left: 15px;\n    border-radius: var(--sidebar-border-radius);\n    z-index: 100000;\n    width: var(--sidebar-width);\n    max-height: 100%;\n    box-sizing: border-box;\n    overflow-y: auto;\n    overflow-x: hidden;\n    font-size: 13px;\n    line-height: 1em; /* prevent emojis from breaking height of the title */\n}\n\n.sidebar-cables::selection {\n    background-color: var(--sidebar-color);\n    color: #EEEEEE;\n}\n\n.sidebar-cables::-webkit-scrollbar {\n    background-color: transparent;\n    --cables-scrollbar-width: 8px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-track {\n    background-color: transparent;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-thumb {\n    background-color: #333333;\n    border-radius: 4px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables--closed {\n    width: auto;\n}\n\n.sidebar__close-button {\n    background-color: #222;\n    /*-webkit-user-select: none;  */\n    /*-moz-user-select: none;     */\n    /*-ms-user-select: none;      */\n    /*user-select: none;          */\n    /*transition: background-color var(--sidebar-hover-transition-time);*/\n    /*color: #CCCCCC;*/\n    height: 2px;\n    /*border-bottom:20px solid #222;*/\n\n    /*box-sizing: border-box;*/\n    /*padding-top: 2px;*/\n    /*text-align: center;*/\n    /*cursor: pointer;*/\n    /*border-radius: 0 0 var(--sidebar-border-radius) var(--sidebar-border-radius);*/\n    /*opacity: 1.0;*/\n    /*transition: opacity 0.3s;*/\n    /*overflow: hidden;*/\n}\n\n.sidebar__close-button-icon {\n    display: inline-block;\n    /*opacity: 0;*/\n    width: 20px;\n    height: 20px;\n    /*position: relative;*/\n    /*top: -1px;*/\n\n\n}\n\n.sidebar--closed {\n    width: auto;\n    margin-right: 20px;\n}\n\n.sidebar--closed .sidebar__close-button {\n    margin-top: 8px;\n    margin-left: 8px;\n    padding:10px;\n\n    height: 25px;\n    width:25px;\n    border-radius: 50%;\n    cursor: pointer;\n    opacity: 0.3;\n    background-repeat: no-repeat;\n    background-position: center center;\n    transform:rotate(180deg);\n}\n\n.sidebar--closed .sidebar__group\n{\n    display:none;\n\n}\n.sidebar--closed .sidebar__close-button-icon {\n    background-position: 0px 0px;\n}\n\n.sidebar__close-button:hover {\n    background-color: #111111;\n    opacity: 1.0 !important;\n}\n\n/*\n * SIDEBAR ITEMS\n */\n\n.sidebar__items {\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5;*/\n    background-color: #222;\n    padding-bottom: 20px;\n}\n\n.sidebar--closed .sidebar__items {\n    /* max-height: 0; */\n    height: 0;\n    display: none;\n    pointer-interactions: none;\n}\n\n.sidebar__item__right {\n    float: right;\n}\n\n/*\n * SIDEBAR GROUP\n */\n\n.sidebar__group {\n    /*background-color: #1A1A1A;*/\n    overflow: hidden;\n    box-sizing: border-box;\n    animate: height;\n    /*background-color: #151515;*/\n    /* max-height: 1000px; */\n    /* transition: max-height 0.5s; */\n--sidebar-group-header-height: 33px;\n}\n\n.sidebar__group-items\n{\n    padding-top: 15px;\n    padding-bottom: 15px;\n}\n\n.sidebar__group--closed {\n    /* max-height: 13px; */\n    height: var(--sidebar-group-header-height);\n}\n\n.sidebar__group-header {\n    box-sizing: border-box;\n    color: #EEEEEE;\n    background-color: #151515;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n\n    /*height: 100%;//var(--sidebar-group-header-height);*/\n\n    padding-top: 7px;\n    text-transform: uppercase;\n    letter-spacing: 0.08em;\n    cursor: pointer;\n    /*transition: background-color var(--sidebar-hover-transition-time);*/\n    position: relative;\n}\n\n.sidebar__group-header:hover {\n  background-color: #111111;\n}\n\n.sidebar__group-header-title {\n  /*float: left;*/\n  overflow: hidden;\n  padding: 0 15px;\n  padding-top:5px;\n  padding-bottom:10px;\n  font-weight:bold;\n}\n\n.sidebar__group-header-undo {\n    float: right;\n    overflow: hidden;\n    padding-right: 15px;\n    padding-top:5px;\n    font-weight:bold;\n  }\n\n.sidebar__group-header-icon {\n    width: 17px;\n    height: 14px;\n    background-repeat: no-repeat;\n    display: inline-block;\n    position: absolute;\n    background-size: cover;\n\n    /* icon open */\n    /* feather icon: chevron up */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 4px;\n    right: 5px;\n    opacity: 0.0;\n    transition: opacity 0.3;\n}\n\n.sidebar__group-header:hover .sidebar__group-header-icon {\n    opacity: 1.0;\n}\n\n/* icon closed */\n.sidebar__group--closed .sidebar__group-header-icon {\n    /* feather icon: chevron down */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);\n    top: 4px;\n    right: 5px;\n}\n\n/*\n * SIDEBAR ITEM\n */\n\n.sidebar__item\n{\n    box-sizing: border-box;\n    padding: 7px;\n    padding-left:15px;\n    padding-right:15px;\n\n    overflow: hidden;\n    position: relative;\n}\n\n.sidebar__item-label {\n    display: inline-block;\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    width: calc(50% - 7px);\n    margin-right: 7px;\n    margin-top: 2px;\n    text-overflow: ellipsis;\n    /* overflow: hidden; */\n}\n\n.sidebar__item-value-label {\n    font-family: var(--sidebar-monospace-font-stack);\n    display: inline-block;\n    text-overflow: ellipsis;\n    overflow: hidden;\n    white-space: nowrap;\n    max-width: 60%;\n}\n\n.sidebar__item-value-label::selection {\n    background-color: var(--sidebar-color);\n    color: #EEEEEE;\n}\n\n.sidebar__item + .sidebar__item,\n.sidebar__item + .sidebar__group,\n.sidebar__group + .sidebar__item,\n.sidebar__group + .sidebar__group {\n    /*border-top: 1px solid #272727;*/\n}\n\n/*\n * SIDEBAR ITEM TOGGLE\n */\n\n/*.sidebar__toggle */\n.icon_toggle{\n    cursor: pointer;\n}\n\n.sidebar__toggle-input {\n    --sidebar-toggle-input-color: #CCCCCC;\n    --sidebar-toggle-input-color-hover: #EEEEEE;\n    --sidebar-toggle-input-border-size: 2px;\n    display: inline;\n    float: right;\n    box-sizing: border-box;\n    border-radius: 50%;\n    cursor: pointer;\n    --toggle-size: 11px;\n    margin-top: 2px;\n    background-color: transparent !important;\n    border: var(--sidebar-toggle-input-border-size) solid var(--sidebar-toggle-input-color);\n    width: var(--toggle-size);\n    height: var(--toggle-size);\n    transition: background-color var(--sidebar-hover-transition-time);\n    transition: border-color var(--sidebar-hover-transition-time);\n}\n.sidebar__toggle:hover .sidebar__toggle-input {\n    border-color: var(--sidebar-toggle-input-color-hover);\n}\n\n.sidebar__toggle .sidebar__item-value-label {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    max-width: calc(50% - 12px);\n}\n.sidebar__toggle-input::after { clear: both; }\n\n.sidebar__toggle--active .icon_toggle\n{\n\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjMDZmNzhiIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iIzA2Zjc4YiIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjMDZmNzhiIiBzdHJva2U9IiMwNmY3OGIiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiMwNmY3OGIiIHN0cm9rZT0iIzA2Zjc4YiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    opacity: 1;\n    transform: rotate(0deg);\n}\n\n\n.icon_toggle\n{\n    float: right;\n    width:40px;\n    height:18px;\n    background-image: url(data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjE1cHgiIHdpZHRoPSIzMHB4IiBmaWxsPSIjYWFhYWFhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTAwIDEwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZmlsbD0iI2FhYWFhYSIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCBjMTIuNjUsMCwyMy0xMC4zNSwyMy0yM2wwLDBjMC0xMi42NS0xMC4zNS0yMy0yMy0yM0gzMHogTTcwLDY3Yy05LjM4OSwwLTE3LTcuNjEtMTctMTdzNy42MTEtMTcsMTctMTdzMTcsNy42MSwxNywxNyAgICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PC9nPjwvZz48Zz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMwLDI3QzE3LjM1LDI3LDcsMzcuMzUsNyw1MGwwLDBjMCwxMi42NSwxMC4zNSwyMywyMywyM2g0MCAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMweiBNNzAsNjdjLTkuMzg5LDAtMTctNy42MS0xNy0xN3M3LjYxMS0xNywxNy0xN3MxNyw3LjYxLDE3LDE3ICAgUzc5LjM4OSw2Nyw3MCw2N3oiPjwvcGF0aD48L2c+PGcgZGlzcGxheT0ibm9uZSI+PGcgZGlzcGxheT0iaW5saW5lIj48cGF0aCBmaWxsPSIjYWFhYWFhIiBzdHJva2U9IiNhYWFhYWEiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBkPSJNNyw1MGMwLDEyLjY1LDEwLjM1LDIzLDIzLDIzaDQwICAgIGMxMi42NSwwLDIzLTEwLjM1LDIzLTIzbDAsMGMwLTEyLjY1LTEwLjM1LTIzLTIzLTIzSDMwQzE3LjM1LDI3LDcsMzcuMzUsNyw1MEw3LDUweiI+PC9wYXRoPjwvZz48Y2lyY2xlIGRpc3BsYXk9ImlubGluZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNhYWFhYWEiIHN0cm9rZT0iI2FhYWFhYSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSI3MCIgY3k9IjUwIiByPSIxNyI+PC9jaXJjbGU+PC9nPjxnIGRpc3BsYXk9Im5vbmUiPjxwYXRoIGRpc3BsYXk9ImlubGluZSIgZD0iTTcwLDI1SDMwQzE2LjIxNSwyNSw1LDM2LjIxNSw1LDUwczExLjIxNSwyNSwyNSwyNWg0MGMxMy43ODUsMCwyNS0xMS4yMTUsMjUtMjVTODMuNzg1LDI1LDcwLDI1eiBNNzAsNzEgICBIMzBDMTguNDIxLDcxLDksNjEuNTc5LDksNTBzOS40MjEtMjEsMjEtMjFoNDBjMTEuNTc5LDAsMjEsOS40MjEsMjEsMjFTODEuNTc5LDcxLDcwLDcxeiBNNzAsMzFjLTEwLjQ3NywwLTE5LDguNTIzLTE5LDE5ICAgczguNTIzLDE5LDE5LDE5czE5LTguNTIzLDE5LTE5UzgwLjQ3NywzMSw3MCwzMXogTTcwLDY1Yy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1czYuNzI5LTE1LDE1LTE1czE1LDYuNzI5LDE1LDE1Uzc4LjI3MSw2NSw3MCw2NXoiPjwvcGF0aD48L2c+PC9zdmc+);\n    background-size: 50px 37px;\n    background-position: -6px -10px;\n    transform: rotate(180deg);\n    opacity: 0.4;\n}\n\n\n\n/*.sidebar__toggle--active .sidebar__toggle-input {*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    background-color: var(--sidebar-toggle-input-color);*/\n/*}*/\n/*.sidebar__toggle--active .sidebar__toggle-input:hover*/\n/*{*/\n/*    background-color: var(--sidebar-toggle-input-color-hover);*/\n/*    border-color: var(--sidebar-toggle-input-color-hover);*/\n/*    transition: background-color var(--sidebar-hover-transition-time);*/\n/*    transition: border-color var(--sidebar-hover-transition-time);*/\n/*}*/\n\n/*\n * SIDEBAR ITEM BUTTON\n */\n\n.sidebar__button {}\n\n.sidebar__button-input:active\n{\n    background-color: #555 !important;\n}\n\n.sidebar__button-input {\n    -webkit-user-select: none;  /* Chrome all / Safari all */\n    -moz-user-select: none;     /* Firefox all */\n    -ms-user-select: none;      /* IE 10+ */\n    user-select: none;          /* Likely future */\n    min-height: 24px;\n    background-color: transparent;\n    color: #CCCCCC;\n    box-sizing: border-box;\n    padding-top: 3px;\n    text-align: center;\n    border-radius: 125px;\n    border:2px solid #555;\n    cursor: pointer;\n    padding-bottom: 3px;\n}\n\n.sidebar__button-input.plus, .sidebar__button-input.minus {\n    display: inline-block;\n    min-width: 20px;\n}\n\n.sidebar__button-input:hover {\n  background-color: #333;\n  border:2px solid var(--sidebar-color);\n}\n\n/*\n * VALUE DISPLAY (shows a value)\n */\n\n.sidebar__value-display {}\n\n/*\n * SLIDER\n */\n\n.sidebar__slider {\n    --sidebar-slider-input-height: 3px;\n}\n\n.sidebar__slider-input-wrapper {\n    width: 100%;\n\n    margin-top: 8px;\n    position: relative;\n}\n\n.sidebar__slider-input {\n    -webkit-appearance: none;\n    appearance: none;\n    margin: 0;\n    width: 100%;\n    height: var(--sidebar-slider-input-height);\n    background: #555;\n    cursor: pointer;\n    outline: 0;\n\n    -webkit-transition: .2s;\n    transition: background-color .2s;\n    border: none;\n}\n\n.sidebar__slider-input:focus, .sidebar__slider-input:hover {\n    border: none;\n}\n\n.sidebar__slider-input-active-track {\n    user-select: none;\n    position: absolute;\n    z-index: 11;\n    top: 0;\n    left: 0;\n    background-color: var(--sidebar-color);\n    pointer-events: none;\n    height: var(--sidebar-slider-input-height);\n    max-width: 100%;\n}\n\n/* Mouse-over effects */\n.sidebar__slider-input:hover {\n    /*background-color: #444444;*/\n}\n\n/*.sidebar__slider-input::-webkit-progress-value {*/\n/*    background-color: green;*/\n/*    color:green;*/\n\n/*    }*/\n\n/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */\n\n.sidebar__slider-input::-moz-range-thumb\n{\n    position: absolute;\n    height: 15px;\n    width: 15px;\n    z-index: 900 !important;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: var(--sidebar-color) !important;\n    user-select: none;\n\n}\n\n.sidebar__slider-input::-webkit-slider-thumb\n{\n    position: relative;\n    appearance: none;\n    -webkit-appearance: none;\n    user-select: none;\n    height: 15px;\n    width: 15px;\n    display: block;\n    z-index: 900 !important;\n    border: 0;\n    border-radius: 20px !important;\n    cursor: pointer;\n    background: #777 !important;\n}\n\n.sidebar__slider-input:hover ::-webkit-slider-thumb {\n    background-color: #EEEEEE !important;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb {*/\n\n/*    width: 0 !important;*/\n/*    height: var(--sidebar-slider-input-height);*/\n/*    background: #EEEEEE;*/\n/*    cursor: pointer;*/\n/*    border-radius: 0 !important;*/\n/*    border: none;*/\n/*    outline: 0;*/\n/*    z-index: 100 !important;*/\n/*}*/\n\n.sidebar__slider-input::-moz-range-track {\n    background-color: transparent;\n    z-index: 11;\n}\n\n/*.sidebar__slider-input::-moz-range-thumb:hover {*/\n  /* background-color: #EEEEEE; */\n/*}*/\n\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input-active-track {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-moz-range-thumb {*/\n/*    background-color: #fff !important;*/\n/*}*/\n\n/*.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-webkit-slider-thumb {*/\n/*    background-color: #EEEEEE;*/\n/*}*/\n\n.sidebar__slider input[type=text],\n.sidebar__slider input[type=paddword]\n{\n    box-sizing: border-box;\n    /*background-color: #333333;*/\n    text-align: right;\n    color: #BBBBBB;\n    display: inline-block;\n    background-color: transparent !important;\n\n    width: 40%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__slider input[type=text]:active,\n.sidebar__slider input[type=text]:focus,\n.sidebar__slider input[type=text]:hover\n.sidebar__slider input[type=password]:active,\n.sidebar__slider input[type=password]:focus,\n.sidebar__slider input[type=password]:hover\n{\n\n    color: #EEEEEE;\n}\n\n/*\n * TEXT / DESCRIPTION\n */\n\n.sidebar__text .sidebar__item-label {\n    width: auto;\n    display: block;\n    max-height: none;\n    margin-right: 0;\n    line-height: 1.1em;\n}\n\n/*\n * SIDEBAR INPUT\n */\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text],\n.sidebar__text-input input[type=password] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: 50%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    border:1px solid #666;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__text-input textarea:focus::placeholder {\n  color: transparent;\n}\n\n.sidebar__color-picker .sidebar__item-label\n{\n    width:45%;\n}\n\n.sidebar__text-input textarea,\n.sidebar__text-input input[type=text]:active,\n.sidebar__text-input input[type=text]:focus,\n.sidebar__text-input input[type=text]:hover,\n.sidebar__text-input input[type=password]:active,\n.sidebar__text-input input[type=password]:focus,\n.sidebar__text-input input[type=password]:hover {\n    background-color: transparent;\n    color: #EEEEEE;\n}\n\n.sidebar__text-input textarea\n{\n    margin-top:10px;\n    height:60px;\n    width:100%;\n}\n\n/*\n * SIDEBAR SELECT\n */\n\n\n\n .sidebar__select {}\n .sidebar__select-select {\n    color: #BBBBBB;\n    /*-webkit-appearance: none;*/\n    /*-moz-appearance: none;*/\n    appearance: none;\n    /*box-sizing: border-box;*/\n    width: 50%;\n    /*height: 20px;*/\n    background-color: #333333;\n    /*background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);*/\n    background-repeat: no-repeat;\n    background-position: right center;\n    background-size: 16px 16px;\n    margin: 0;\n    /*padding: 0 2 2 6px;*/\n    border-radius: 5px;\n    border: 1px solid #777;\n    background-color: #444;\n    cursor: pointer;\n    outline: none;\n    padding-left: 5px;\n\n }\n\n.sidebar__select-select:hover,\n.sidebar__select-select:active,\n.sidebar__select-select:inactive {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*.sidebar__select-select option*/\n/*{*/\n/*    background-color: #444444;*/\n/*    color: #bbb;*/\n/*}*/\n\n.sidebar__select-select option:checked\n{\n    background-color: #000;\n    color: #FFF;\n}\n\n\n/*\n * COLOR PICKER\n */\n\n\n .sidebar__color-picker input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: calc(50% - 21px); /* 50% minus space of picker circle */\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n    margin-right: 7px;\n}\n\n.sidebar__color-picker input[type=text]:active,\n.sidebar__color-picker input[type=text]:focus,\n.sidebar__color-picker input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\ndiv.sidebar__color-picker-color-input,\n.sidebar__color-picker input[type=color],\n.sidebar__palette-picker input[type=color] {\n    display: inline-block;\n    border-radius: 100%;\n    height: 14px;\n    width: 14px;\n\n    padding: 0;\n    border: none;\n    /*border:2px solid red;*/\n    border-color: transparent;\n    outline: none;\n    background: none;\n    appearance: none;\n    -moz-appearance: none;\n    -webkit-appearance: none;\n    cursor: pointer;\n    position: relative;\n    top: 3px;\n}\n.sidebar__color-picker input[type=color]:focus,\n.sidebar__palette-picker input[type=color]:focus {\n    outline: none;\n}\n.sidebar__color-picker input[type=color]::-moz-color-swatch,\n.sidebar__palette-picker input[type=color]::-moz-color-swatch {\n    border: none;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch-wrapper,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch-wrapper {\n    padding: 0;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch {\n    border: none;\n    border-radius: 100%;\n}\n\n/*\n * Palette Picker\n */\n.sidebar__palette-picker .sidebar__palette-picker-color-input.first {\n    margin-left: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input.last {\n    margin-right: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input {\n    margin: 0 4px;\n}\n\n.sidebar__palette-picker .circlebutton {\n    width: 14px;\n    height: 14px;\n    border-radius: 1em;\n    display: inline-block;\n    top: 3px;\n    position: relative;\n}\n\n/*\n * Preset\n */\n.sidebar__item-presets-preset\n{\n    padding:4px;\n    cursor:pointer;\n    padding-left:8px;\n    padding-right:8px;\n    margin-right:4px;\n    background-color:#444;\n}\n\n.sidebar__item-presets-preset:hover\n{\n    background-color:#666;\n}\n\n.sidebar__greyout\n{\n    background: #222;\n    opacity: 0.8;\n    width: 100%;\n    height: 100%;\n    position: absolute;\n    z-index: 1000;\n    right: 0;\n    top: 0;\n}\n\n.sidebar_tabs\n{\n    background-color: #151515;\n    padding-bottom: 0px;\n}\n\n.sidebar_switchs\n{\n    float: right;\n}\n\n.sidebar_tab\n{\n    float:left;\n    background-color: #151515;\n    border-bottom:1px solid transparent;\n    padding-right:7px;\n    padding-left:7px;\n    padding-bottom: 5px;\n    padding-top: 5px;\n    cursor:pointer;\n}\n\n.sidebar_tab_active\n{\n    background-color: #272727;\n    color:white;\n}\n\n.sidebar_tab:hover\n{\n    border-bottom:1px solid #777;\n    color:white;\n}\n\n\n.sidebar_switch\n{\n    float:left;\n    background-color: #444;\n    padding-right:7px;\n    padding-left:7px;\n    padding-bottom: 5px;\n    padding-top: 5px;\n    cursor:pointer;\n}\n\n.sidebar_switch:last-child\n{\n    border-top-right-radius: 7px;\n    border-bottom-right-radius: 7px;\n}\n\n.sidebar_switch:first-child\n{\n    border-top-left-radius: 7px;\n    border-bottom-left-radius: 7px;\n}\n\n\n.sidebar_switch_active\n{\n    background-color: #999;\n    color:white;\n}\n\n.sidebar_switch:hover\n{\n    color:white;\n}\n\n",};
// vars
const CSS_ELEMENT_CLASS = "cables-sidebar-style"; /* class for the style element to be generated */
const CSS_ELEMENT_DYNAMIC_CLASS = "cables-sidebar-dynamic-style"; /* things which can be set via op-port, but not attached to the elements themselves, e.g. minimized opacity */
const SIDEBAR_CLASS = "sidebar-cables";
const SIDEBAR_ID = "sidebar" + CABLES.uuid();
const SIDEBAR_ITEMS_CLASS = "sidebar__items";
const SIDEBAR_OPEN_CLOSE_BTN_CLASS = "sidebar__close-button";

const BTN_TEXT_OPEN = ""; // 'Close';
const BTN_TEXT_CLOSED = ""; // 'Show Controls';

let openCloseBtn = null;
let openCloseBtnIcon = null;
let headerTitleText = null;

// inputs
const visiblePort = op.inValueBool("Visible", true);
const opacityPort = op.inValueSlider("Opacity", 1);
const defaultMinimizedPort = op.inValueBool("Default Minimized");
const minimizedOpacityPort = op.inValueSlider("Minimized Opacity", 0.5);
const undoButtonPort = op.inValueBool("Show undo button", false);
const inMinimize = op.inValueBool("Show Minimize", false);

const inTitle = op.inString("Title", "");
const side = op.inValueBool("Side");
const addCss = op.inValueBool("Default CSS", true);

let doc = op.patch.cgl.canvas.ownerDocument;

// outputs
const childrenPort = op.outObject("childs");
childrenPort.setUiAttribs({ "title": "Children" });

const isOpenOut = op.outBool("Opfened");
isOpenOut.setUiAttribs({ "title": "Opened" });

let sidebarEl = doc.querySelector("." + SIDEBAR_ID);
if (!sidebarEl) sidebarEl = initSidebarElement();

const sidebarItemsEl = sidebarEl.querySelector("." + SIDEBAR_ITEMS_CLASS);
childrenPort.set({
    "parentElement": sidebarItemsEl,
    "parentOp": op,
});
onDefaultMinimizedPortChanged();
initSidebarCss();
updateDynamicStyles();

addCss.onChange = () =>
{
    initSidebarCss();
    updateDynamicStyles();
};
visiblePort.onChange = onVisiblePortChange;
opacityPort.onChange = onOpacityPortChange;
defaultMinimizedPort.onChange = onDefaultMinimizedPortChanged;
minimizedOpacityPort.onChange = onMinimizedOpacityPortChanged;
undoButtonPort.onChange = onUndoButtonChange;
op.onDelete = onDelete;

function onMinimizedOpacityPortChanged()
{
    updateDynamicStyles();
}

inMinimize.onChange = updateMinimize;

function updateMinimize(header)
{
    if (!header || header.uiAttribs) header = doc.querySelector(".sidebar-cables .sidebar__group-header");
    if (!header) return;

    const undoButton = doc.querySelector(".sidebar-cables .sidebar__group-header .sidebar__group-header-undo");

    if (inMinimize.get())
    {
        header.classList.add("iconsidebar-chevron-up");
        header.classList.add("iconsidebar-minimizebutton");

        if (undoButton)undoButton.style.marginRight = "20px";
    }
    else
    {
        header.classList.remove("iconsidebar-chevron-up");
        header.classList.remove("iconsidebar-minimizebutton");

        if (undoButton)undoButton.style.marginRight = "initial";
    }
}

side.onChange = function ()
{
    if (!sidebarEl) return;
    if (side.get()) sidebarEl.classList.add("sidebar-cables-right");
    else sidebarEl.classList.remove("sidebar-cables-right");
};

function onUndoButtonChange()
{
    const header = doc.querySelector(".sidebar-cables .sidebar__group-header");
    if (header)
    {
        initUndoButton(header);
    }
}

function initUndoButton(header)
{
    if (header)
    {
        const undoButton = doc.querySelector(".sidebar-cables .sidebar__group-header .sidebar__group-header-undo");
        if (undoButton)
        {
            if (!undoButtonPort.get())
            {
                // header.removeChild(undoButton);
                undoButton.remove();
            }
        }
        else
        {
            if (undoButtonPort.get())
            {
                const headerUndo = doc.createElement("span");
                headerUndo.classList.add("sidebar__group-header-undo");
                headerUndo.classList.add("sidebar-icon-undo");

                headerUndo.addEventListener("click", function (event)
                {
                    event.stopPropagation();
                    const reloadables = doc.querySelectorAll(".sidebar-cables .sidebar__reloadable");
                    const doubleClickEvent = doc.createEvent("MouseEvents");
                    doubleClickEvent.initEvent("dblclick", true, true);
                    reloadables.forEach((reloadable) =>
                    {
                        reloadable.dispatchEvent(doubleClickEvent);
                    });
                });
                header.appendChild(headerUndo);
            }
        }
    }
    updateMinimize(header);
}

function onDefaultMinimizedPortChanged()
{
    if (!openCloseBtn) { return; }
    if (defaultMinimizedPort.get())
    {
        sidebarEl.classList.add("sidebar--closed");
        if (visiblePort.get()) isOpenOut.set(false);
    }
    else
    {
        sidebarEl.classList.remove("sidebar--closed");
        if (visiblePort.get()) isOpenOut.set(true);
    }
}

function onOpacityPortChange()
{
    const opacity = opacityPort.get();
    sidebarEl.style.opacity = opacity;
}

function onVisiblePortChange()
{
    if (!sidebarEl) return;
    if (visiblePort.get())
    {
        sidebarEl.style.display = "block";
        if (!sidebarEl.classList.contains("sidebar--closed")) isOpenOut.set(true);
    }
    else
    {
        sidebarEl.style.display = "none";
        isOpenOut.set(false);
    }
}

side.onChanged = function ()
{

};

/**
 * Some styles cannot be set directly inline, so a dynamic stylesheet is needed.
 * Here hover states can be set later on e.g.
 */
function updateDynamicStyles()
{
    const dynamicStyles = doc.querySelectorAll("." + CSS_ELEMENT_DYNAMIC_CLASS);
    if (dynamicStyles)
    {
        dynamicStyles.forEach(function (e)
        {
            e.parentNode.removeChild(e);
        });
    }

    if (!addCss.get()) return;

    const newDynamicStyle = doc.createElement("style");
    newDynamicStyle.classList.add("cablesEle");
    newDynamicStyle.classList.add(CSS_ELEMENT_DYNAMIC_CLASS);
    let cssText = ".sidebar--closed .sidebar__close-button { ";
    cssText += "opacity: " + minimizedOpacityPort.get();
    cssText += "}";
    const cssTextEl = doc.createTextNode(cssText);
    newDynamicStyle.appendChild(cssTextEl);
    doc.body.appendChild(newDynamicStyle);
}

function initSidebarElement()
{
    const element = doc.createElement("div");
    element.classList.add(SIDEBAR_CLASS);
    element.classList.add(SIDEBAR_ID);
    const canvasWrapper = op.patch.cgl.canvas.parentElement; /* maybe this is bad outside cables!? */

    // header...
    const headerGroup = doc.createElement("div");
    headerGroup.classList.add("sidebar__group");

    element.appendChild(headerGroup);
    const header = doc.createElement("div");
    header.classList.add("sidebar__group-header");

    element.appendChild(header);
    const headerTitle = doc.createElement("span");
    headerTitle.classList.add("sidebar__group-header-title");
    headerTitleText = doc.createElement("span");
    headerTitleText.classList.add("sidebar__group-header-title-text");
    headerTitleText.innerHTML = inTitle.get();
    headerTitle.appendChild(headerTitleText);
    header.appendChild(headerTitle);

    initUndoButton(header);
    updateMinimize(header);

    headerGroup.appendChild(header);
    element.appendChild(headerGroup);
    headerGroup.addEventListener("click", onOpenCloseBtnClick);

    if (!canvasWrapper)
    {
        op.warn("[sidebar] no canvas parentelement found...");
        return;
    }
    canvasWrapper.appendChild(element);
    const items = doc.createElement("div");
    items.classList.add(SIDEBAR_ITEMS_CLASS);
    element.appendChild(items);
    openCloseBtn = doc.createElement("div");
    openCloseBtn.classList.add(SIDEBAR_OPEN_CLOSE_BTN_CLASS);
    openCloseBtn.addEventListener("click", onOpenCloseBtnClick);
    element.appendChild(openCloseBtn);

    return element;
}

inTitle.onChange = function ()
{
    if (headerTitleText)headerTitleText.innerHTML = inTitle.get();
};

function setClosed(b)
{

}

function onOpenCloseBtnClick(ev)
{
    ev.stopPropagation();
    if (!sidebarEl) { op.logError("Sidebar could not be closed..."); return; }
    sidebarEl.classList.toggle("sidebar--closed");
    const btn = ev.target;
    let btnText = BTN_TEXT_OPEN;
    if (sidebarEl.classList.contains("sidebar--closed"))
    {
        btnText = BTN_TEXT_CLOSED;
        isOpenOut.set(false);
    }
    else
    {
        isOpenOut.set(true);
    }
}

function initSidebarCss()
{
    const cssElements = doc.querySelectorAll("." + CSS_ELEMENT_CLASS);
    // remove old script tag
    if (cssElements)
    {
        cssElements.forEach((e) =>
        {
            e.parentNode.removeChild(e);
        });
    }

    if (!addCss.get()) return;

    const newStyle = doc.createElement("style");

    newStyle.innerHTML = attachments.style_css;
    newStyle.classList.add(CSS_ELEMENT_CLASS);
    newStyle.classList.add("cablesEle");
    doc.body.appendChild(newStyle);
}

function onDelete()
{
    removeElementFromDOM(sidebarEl);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}


};

Ops.Sidebar.Sidebar.prototype = new CABLES.Op();
CABLES.OPS["5a681c35-78ce-4cb3-9858-bc79c34c6819"]={f:Ops.Sidebar.Sidebar,objName:"Ops.Sidebar.Sidebar"};




// **************************************************************
// 
// Ops.Sidebar.Button_v2
// 
// **************************************************************

Ops.Sidebar.Button_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
// inputs
const parentPort = op.inObject("link");
const buttonTextPort = op.inString("Text", "Button");

// outputs
const siblingsPort = op.outObject("childs");
const buttonPressedPort = op.outTrigger("Pressed Trigger");

const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

// vars
const el = document.createElement("div");
el.dataset.op = op.id;
el.classList.add("cablesEle");
el.classList.add("sidebar__item");
el.classList.add("sidebar--button");
const input = document.createElement("div");
input.classList.add("sidebar__button-input");
el.appendChild(input);
input.addEventListener("click", onButtonClick);
const inputText = document.createTextNode(buttonTextPort.get());
input.appendChild(inputText);
op.toWorkNeedsParent("Ops.Sidebar.Sidebar");

// events
parentPort.onChange = onParentChanged;
buttonTextPort.onChange = onButtonTextChanged;
op.onDelete = onDelete;

const greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};

function onButtonClick()
{
    buttonPressedPort.trigger();
}

function onButtonTextChanged()
{
    const buttonText = buttonTextPort.get();
    input.textContent = buttonText;
    if (CABLES.UI)
    {
        op.setUiAttrib({ "extendTitle": buttonText });
    }
}

function onParentChanged()
{
    siblingsPort.set(null);
    const parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(parent);
    }
    else
    { // detach
        if (el.parentElement)
        {
            el.parentElement.removeChild(el);
        }
    }
}

function showElement(el)
{
    if (el)
    {
        el.style.display = "block";
    }
}

function hideElement(el)
{
    if (el)
    {
        el.style.display = "none";
    }
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild)
    {
        el.parentNode.removeChild(el);
    }
}


};

Ops.Sidebar.Button_v2.prototype = new CABLES.Op();
CABLES.OPS["5e9c6933-0605-4bf7-8671-a016d917f327"]={f:Ops.Sidebar.Button_v2,objName:"Ops.Sidebar.Button_v2"};




// **************************************************************
// 
// Ops.Gl.Phong.PointLight_v5
// 
// **************************************************************

Ops.Gl.Phong.PointLight_v5 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const cgl = op.patch.cgl;
const gl = cgl.gl;
const mesh = CGL.MESHES.getSimpleRect(cgl, "fullscreenRectangle");

function Light(config)
{
    this.type = config.type || "point";
    this.color = config.color || [1, 1, 1];
    this.specular = config.specular || [0, 0, 0];
    this.position = config.position || null;
    this.intensity = config.intensity || 1;
    this.radius = config.radius || 1;
    this.falloff = config.falloff || 1;
    this.spotExponent = config.spotExponent || 1;
    this.cosConeAngle = Math.cos(CGL.DEG2RAD * this.coneAngle);
    this.conePointAt = config.conePointAt || [0, 0, 0];
    this.castShadow = config.castShadow || false;
    return this;
}

// * OP START *
const inTrigger = op.inTrigger("Trigger In");
const inCastLight = op.inBool("Cast Light", true);
const inIntensity = op.inFloat("Intensity", 2);
const inRadius = op.inFloat("Radius", 15);

const inPosX = op.inFloat("X", 0);
const inPosY = op.inFloat("Y", 2);
const inPosZ = op.inFloat("Z", 0.75);

const positionIn = [inPosX, inPosY, inPosZ];
op.setPortGroup("Position", positionIn);

const inR = op.inFloat("R", 0.8);
const inG = op.inFloat("G", 0.8);
const inB = op.inFloat("B", 0.8);

inR.setUiAttribs({ "colorPick": true });
const colorIn = [inR, inG, inB];
op.setPortGroup("Color", colorIn);

const inSpecularR = op.inFloat("Specular R", 1);
const inSpecularG = op.inFloat("Specular G", 1);
const inSpecularB = op.inFloat("Specular B", 1);

inSpecularR.setUiAttribs({ "colorPick": true });
const colorSpecularIn = [inSpecularR, inSpecularG, inSpecularB];
op.setPortGroup("Specular Color", colorSpecularIn);

const inFalloff = op.inFloatSlider("Falloff", 0.5);

const attribIns = [inIntensity, inCastLight, inRadius];
op.setPortGroup("Light Attributes", attribIns);

const inCastShadow = op.inBool("Cast Shadow", false);
const inRenderMapActive = op.inBool("Rendering Active", true);
const inMapSize = op.inSwitch("Map Size", [256, 512, 1024, 2048], 512);
const inShadowStrength = op.inFloatSlider("Shadow Strength", 1);
const inNear = op.inFloat("Near", 0.1);
const inFar = op.inFloat("Far", 30);
const inBias = op.inFloatSlider("Bias", 0.004);
const inPolygonOffset = op.inInt("Polygon Offset", 0);
op.setPortGroup("", [inCastShadow]);
op.setPortGroup("Shadow Map Settings", [inMapSize, inRenderMapActive, inShadowStrength, inNear, inFar, inBias, inPolygonOffset]);
const shadowProperties = [inNear, inFar];
inMapSize.setUiAttribs({ "greyout": !inCastShadow.get() });
inRenderMapActive.setUiAttribs({ "greyout": !inCastShadow.get() });
inShadowStrength.setUiAttribs({ "greyout": !inCastShadow.get() });
inNear.setUiAttribs({ "greyout": !inCastShadow.get() });
inBias.setUiAttribs({ "greyout": !inCastShadow.get() });
inFar.setUiAttribs({ "greyout": !inCastShadow.get() });
inPolygonOffset.setUiAttribs({ "greyout": !inCastShadow.get() });

let updating = false;

inCastShadow.onChange = function ()
{
    updating = true;
    updateLight = true;

    inMapSize.setUiAttribs({ "greyout": !inCastShadow.get() });
    inRenderMapActive.setUiAttribs({ "greyout": !inCastShadow.get() });
    inShadowStrength.setUiAttribs({ "greyout": !inCastShadow.get() });
    inNear.setUiAttribs({ "greyout": !inCastShadow.get() });
    inFar.setUiAttribs({ "greyout": !inCastShadow.get() });
    inBias.setUiAttribs({ "greyout": !inCastShadow.get() });
    inPolygonOffset.setUiAttribs({ "greyout": !inCastShadow.get() });
};

const outTrigger = op.outTrigger("Trigger Out");
const outCubemap = op.outObject("Cubemap", null, "texture");
const outWorldPosX = op.outNumber("World Position X");
const outWorldPosY = op.outNumber("World Position Y");
const outWorldPosZ = op.outNumber("World Position Z");

const newLight = new CGL.Light(cgl, {
    "type": "point",
    "position": [0, 1, 2].map(function (i) { return positionIn[i].get(); }),
    "color": [0, 1, 2].map(function (i) { return colorIn[i].get(); }),
    "specular": [0, 1, 2].map(function (i) { return colorSpecularIn[i].get(); }),
    "intensity": inIntensity.get(),
    "radius": inRadius.get(),
    "falloff": inFalloff.get(),
    "shadowStrength": inShadowStrength.get(),
    "shadowBias": inBias.get()
});
newLight.castLight = inCastLight.get();

let updateLight = false;

inPosX.onChange = inPosY.onChange = inPosZ.onChange = inR.onChange = inG.onChange = inB.onChange
= inSpecularR.onChange = inSpecularG.onChange = inSpecularB.onChange = inIntensity.onChange
= inCastLight.onChange = inRadius.onChange = inFalloff.onChange = inNear.onChange = inFar.onChange = inShadowStrength.onChange = function ()
        {
            updateLight = true;
        };

inMapSize.onChange = function ()
{
    // TODO: update this one
    updating = true;
};

function updateShadowMapFramebuffer()
{
    if (inCastShadow.get())
    {
        const size = inMapSize.get();
        newLight.createFramebuffer(size, size, {});
        newLight.createShadowMapShader();
    }
    updating = false;
}

const sc = vec3.create();
const result = vec3.create();
const position = vec3.create();
const transVec = vec3.create();

function drawHelpers()
{
    if (cgl.frameStore.shadowPass) return;
    if (cgl.shouldDrawHelpers(op))
    {
        gui.setTransformGizmo({
            "posX": inPosX,
            "posY": inPosY,
            "posZ": inPosZ,
        });

        cgl.pushModelMatrix();
        mat4.translate(cgl.mMatrix, cgl.mMatrix, transVec);
        CABLES.GL_MARKER.drawSphere(op, inRadius.get());
        cgl.popModelMatrix();
    }
}

let errorActive = false;

inTrigger.onTriggered = function ()
{
    if (updating)
    {
        if (cgl.frameStore.shadowPass) return;
        updateShadowMapFramebuffer();
    }

    if (!cgl.frameStore.shadowPass)
    {
        if (!newLight.isUsed && !errorActive)
        {
            op.setUiError("lightUsed", "No operator is using this light. Make sure this op is positioned before an operator that uses lights. Also make sure there is an operator that uses lights after this.", 1); // newLight.isUsed = false;
            errorActive = true;
        }
        else if (!newLight.isUsed && errorActive) {}
        else if (newLight.isUsed && errorActive)
        {
            op.setUiError("lightUsed", null);
            errorActive = false;
        }
        else if (newLight.isUsed && !errorActive) {}

        newLight.isUsed = false;
    }

    if (updateLight)
    {
        newLight.position = [0, 1, 2].map(function (i) { return positionIn[i].get(); });
        newLight.color = [0, 1, 2].map(function (i) { return colorIn[i].get(); });
        newLight.specular = [0, 1, 2].map(function (i) { return colorSpecularIn[i].get(); });
        newLight.intensity = inIntensity.get();
        newLight.radius = inRadius.get();
        newLight.falloff = inFalloff.get();
        newLight.castShadow = inCastShadow.get();
        newLight.castLight = inCastLight.get();
        newLight.updateProjectionMatrix(null, inNear.get(), inFar.get(), null);
        updateLight = false;
    }

    if (!cgl.frameStore.lightStack) cgl.frameStore.lightStack = [];

    vec3.set(transVec, inPosX.get(), inPosY.get(), inPosZ.get());
    vec3.transformMat4(position, transVec, cgl.mMatrix);

    newLight.position = position;

    outWorldPosX.set(newLight.position[0]);
    outWorldPosY.set(newLight.position[1]);
    outWorldPosZ.set(newLight.position[2]);

    if (!cgl.frameStore.shadowPass) drawHelpers();

    cgl.frameStore.lightStack.push(newLight);

    if (inCastShadow.get())
    {
        if (inRenderMapActive.get()) newLight.renderPasses(inPolygonOffset.get(), null, function () { outTrigger.trigger(); });

        if (!cgl.frameStore.shadowPass)
        {
            cgl.frameStore.lightStack.pop();
            newLight.castShadow = inCastShadow.get();
            newLight.shadowBias = inBias.get();
            newLight.shadowStrength = inShadowStrength.get();

            if (newLight.shadowCubeMap)
            {
                if (newLight.shadowCubeMap.cubemap)
                {
                    outCubemap.set(null);
                    outCubemap.set(newLight.shadowCubeMap);
                    if (inRenderMapActive.get())
                    {
                        // needs to be "cloned", cannot save reference.
                        newLight.positionForShadowMap = [newLight.position[0], newLight.position[1], newLight.position[2]];
                    }
                }
            }
            cgl.frameStore.lightStack.push(newLight);
        }
    }
    else
    {
        outCubemap.set(null);
    }

    outTrigger.trigger();
    cgl.frameStore.lightStack.pop();
};


};

Ops.Gl.Phong.PointLight_v5.prototype = new CABLES.Op();
CABLES.OPS["54e5d3f5-e3f4-4381-990d-d5e32b9a2d39"]={f:Ops.Gl.Phong.PointLight_v5,objName:"Ops.Gl.Phong.PointLight_v5"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValue("posX", 0),
    posY = op.inValue("posY", 0),
    posZ = op.inValue("posZ", 0),
    scale = op.inValue("scale", 1),
    rotX = op.inValue("rotX", 0),
    rotY = op.inValue("rotY", 0),
    rotZ = op.inValue("rotZ", 0),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setUiAxisPorts(posX, posY, posZ);

op.toWorkPortsNeedToBeLinked(render, trigger);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let
    doScale = false,
    doTranslate = false,
    translationChanged = true,
    scaleChanged = true,
    rotChanged = true;

rotX.onChange = rotY.onChange = rotZ.onChange = setRotChanged;
posX.onChange = posY.onChange = posZ.onChange = setTranslateChanged;
scale.onChange = setScaleChanged;

render.onTriggered = function ()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged) updateMatrix = true;

    if (updateMatrix) doUpdateMatrix();

    const cg = op.patch.cg || op.patch.cgl;
    cg.pushModelMatrix();
    mat4.multiply(cg.mMatrix, cg.mMatrix, transMatrix);

    trigger.trigger();
    cg.popModelMatrix();

    if (CABLES.UI && CABLES.UI.showCanvasTransforms) gui.setTransform(op.id, posX.get(), posY.get(), posZ.get());

    if (op.isCurrentUiOp())
        gui.setTransformGizmo(
            {
                "posX": posX,
                "posY": posY,
                "posZ": posZ,
            });
};

op.transform3d = function ()
{
    return { "pos": [posX, posY, posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function setTranslateChanged()
{
    translationChanged = true;
}

function setScaleChanged()
{
    scaleChanged = true;
}

function setRotChanged()
{
    rotChanged = true;
}

doUpdateMatrix();


};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exec = op.inTrigger("Update"),
    inMode = op.inBool("Separate inc/dec", false),
    inVal = op.inValue("Value"),
    next = op.outTrigger("Next"),
    inDivisorUp = op.inValue("Inc factor", 4),
    inDivisorDown = op.inValue("Dec factor", 4),
    result = op.outNumber("Result", 0);

let val = 0;
let goal = 0;
let oldVal = 0;
let lastTrigger = 0;

op.toWorkPortsNeedToBeLinked(exec);

let divisorUp;
let divisorDown;
let divisor = 4;
let finished = true;

let selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({ "hidePort": true });

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    const selectedMode = inMode.get();
    if (!selectedMode) selectIndex = MODE_SINGLE;
    else selectIndex = MODE_UP_DOWN;

    if (selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({ "greyout": true });
        inDivisorUp.setUiAttribs({ "title": "Inc/Dec factor" });
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({ "greyout": false });
        inDivisorUp.setUiAttribs({ "title": "Inc factor" });
    }

    getDivisors();
    update();
}

function getDivisors()
{
    if (selectIndex == MODE_SINGLE)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorDown.get();
    }

    if (divisorUp <= 0.2 || divisorUp != divisorUp)divisorUp = 0.2;
    if (divisorDown <= 0.2 || divisorDown != divisorDown)divisorDown = 0.2;
}

inVal.onChange = function ()
{
    finished = false;
    let oldGoal = goal;
    goal = inVal.get();
};

inDivisorUp.onChange = function ()
{
    getDivisors();
};

function update()
{
    let tm = 1;
    if (performance.now() - lastTrigger > 500 || lastTrigger === 0) val = inVal.get() || 0;
    else tm = (performance.now() - lastTrigger) / (performance.now() - lastTrigger);
    lastTrigger = performance.now();

    if (val != val)val = 0;

    if (divisor <= 0)divisor = 0.0001;

    const diff = goal - val;

    if (diff >= 0) val += (diff) / (divisorDown * tm);
    else val += (diff) / (divisorUp * tm);

    if (Math.abs(diff) < 0.00001)val = goal;

    if (divisor != divisor)val = 0;
    if (val != val || val == -Infinity || val == Infinity)val = inVal.get();

    if (oldVal != val)
    {
        result.set(val);
        oldVal = val;
    }

    if (val == goal && !finished)
    {
        finished = true;
        result.set(val);
    }

    next.trigger();
}

exec.onTriggered = function ()
{
    update();
};


};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 1),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}


};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Math.Sum
// 
// **************************************************************

Ops.Math.Sum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 0),
    number2 = op.inValueFloat("number2", 0),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange =
number2.onChange = exec;
exec();

function exec()
{
    const v = number1.get() + number2.get();
    if (!isNaN(v))
        result.set(v);
}


};

Ops.Math.Sum.prototype = new CABLES.Op();
CABLES.OPS["c8fb181e-0b03-4b41-9e55-06b6267bc634"]={f:Ops.Math.Sum,objName:"Ops.Math.Sum"};




// **************************************************************
// 
// Ops.Sidebar.Slider_v3
// 
// **************************************************************

Ops.Sidebar.Slider_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
// constants
const STEP_DEFAULT = 0.00001;

// inputs
const parentPort = op.inObject("link");
const labelPort = op.inString("Text", "Slider");
const minPort = op.inValue("Min", 0);
const maxPort = op.inValue("Max", 1);
const stepPort = op.inValue("Step", STEP_DEFAULT);
const labelSuffix = op.inString("Suffix", "");

const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

const inputValuePort = op.inValue("Input", 0.5);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
const reset = op.inTriggerButton("Reset");

let parent = null;

const defaultValuePort = op.inValue("Default", 0.5);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });

// outputs
const siblingsPort = op.outObject("childs");
const valuePort = op.outNumber("Result", defaultValuePort.get());

op.toWorkNeedsParent("Ops.Sidebar.Sidebar");
op.setPortGroup("Range", [minPort, maxPort, stepPort]);
op.setPortGroup("Display", [inGreyOut, inVisible]);

// vars
const el = document.createElement("div");
el.addEventListener("dblclick", function ()
{
    valuePort.set(parseFloat(defaultValuePort.get()));
    inputValuePort.set(parseFloat(defaultValuePort.get()));
    setValueFieldValue(defaultValuePort.get());
});

el.dataset.op = op.id;
el.classList.add("cablesEle");

el.classList.add("sidebar__item");
el.classList.add("sidebar__slider");
el.classList.add("sidebar__reloadable");

op.patch.on("sidebarStylesChanged", () => { updateActiveTrack(); });

const label = document.createElement("div");
label.classList.add("sidebar__item-label");

const greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

const labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);

const value = document.createElement("input");
value.value = defaultValuePort.get();
value.classList.add("sidebar__text-input-input");
value.setAttribute("type", "text");
value.oninput = onTextInputChanged;
el.appendChild(value);

const suffixEle = document.createElement("span");
// setValueFieldValue(defaultValuePort).get();
// value.setAttribute("type", "text");
// value.oninput = onTextInputChanged;

el.appendChild(suffixEle);

labelSuffix.onChange = () =>
{
    suffixEle.innerHTML = labelSuffix.get();
};

const inputWrapper = document.createElement("div");
inputWrapper.classList.add("sidebar__slider-input-wrapper");
el.appendChild(inputWrapper);

const activeTrack = document.createElement("div");
activeTrack.classList.add("sidebar__slider-input-active-track");
inputWrapper.appendChild(activeTrack);
const input = document.createElement("input");
input.classList.add("sidebar__slider-input");
input.setAttribute("min", minPort.get());
input.setAttribute("max", maxPort.get());
input.setAttribute("type", "range");
input.setAttribute("step", stepPort.get());
input.setAttribute("value", defaultValuePort.get());
input.style.display = "block"; /* needed because offsetWidth returns 0 otherwise */
inputWrapper.appendChild(input);

updateActiveTrack();
input.addEventListener("input", onSliderInput);

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
inputValuePort.onChange = onInputValuePortChanged;
defaultValuePort.onChange = onDefaultValueChanged;
setDefaultValueButtonPort.onTriggered = onSetDefaultValueButtonPress;
minPort.onChange = onMinPortChange;
maxPort.onChange = onMaxPortChange;
stepPort.onChange = stepPortChanged;
op.onDelete = onDelete;

// op.onLoadedValueSet=function()
op.onLoaded = op.onInit = function ()
{
    if (op.patch.config.sidebar)
    {
        op.patch.config.sidebar[labelPort.get()];
        valuePort.set(op.patch.config.sidebar[labelPort.get()]);
    }
    else
    {
        valuePort.set(parseFloat(defaultValuePort.get()));
        inputValuePort.set(parseFloat(defaultValuePort.get()));
        // onInputValuePortChanged();
    }
};

reset.onTriggered = function ()
{
    const newValue = parseFloat(defaultValuePort.get());
    valuePort.set(newValue);
    setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    inputValuePort.set(newValue);
    updateActiveTrack();
};

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};

function onTextInputChanged(ev)
{
    let newValue = parseFloat(ev.target.value);
    if (isNaN(newValue)) newValue = 0;
    const min = minPort.get();
    const max = maxPort.get();
    if (newValue < min) { newValue = min; }
    else if (newValue > max) { newValue = max; }
    // setInputFieldValue(newValue);
    valuePort.set(newValue);
    updateActiveTrack();
    inputValuePort.set(newValue);
    op.refreshParams();
}

function onInputValuePortChanged()
{
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if (newValue > maxValue) { newValue = maxValue; }
    else if (newValue < minValue) { newValue = minValue; }
    // setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    valuePort.set(newValue);
    updateActiveTrack();
}

function onSetDefaultValueButtonPress()
{
    let newValue = parseFloat(inputValuePort.get());
    const minValue = minPort.get();
    const maxValue = maxPort.get();
    if (newValue > maxValue) { newValue = maxValue; }
    else if (newValue < minValue) { newValue = minValue; }
    setValueFieldValue(newValue);
    setInputFieldValue(newValue);
    valuePort.set(newValue);
    defaultValuePort.set(newValue);
    op.refreshParams();

    updateActiveTrack();
}

function onSliderInput(ev)
{
    ev.preventDefault();
    ev.stopPropagation();
    setValueFieldValue(ev.target.value);
    const inputFloat = parseFloat(ev.target.value);
    valuePort.set(inputFloat);
    inputValuePort.set(inputFloat);
    op.refreshParams();

    updateActiveTrack();
    return false;
}

function stepPortChanged()
{
    const step = stepPort.get();
    input.setAttribute("step", step);
    updateActiveTrack();
}

function updateActiveTrack(val)
{
    let valueToUse = parseFloat(input.value);
    if (typeof val !== "undefined") valueToUse = val;
    let availableWidth = activeTrack.parentElement.getBoundingClientRect().width || 220;
    if (parent) availableWidth = parseInt(getComputedStyle(parent.parentElement).getPropertyValue("--sidebar-width")) - 20;

    const trackWidth = CABLES.map(
        valueToUse,
        parseFloat(input.min),
        parseFloat(input.max),
        0,
        availableWidth - 16 /* subtract slider thumb width */
    );
    activeTrack.style.width = trackWidth + "px";
}

function onMinPortChange()
{
    const min = minPort.get();
    input.setAttribute("min", min);
    updateActiveTrack();
}

function onMaxPortChange()
{
    const max = maxPort.get();
    input.setAttribute("max", max);
    updateActiveTrack();
}

function onDefaultValueChanged()
{
    const defaultValue = defaultValuePort.get();
    valuePort.set(parseFloat(defaultValue));
    onMinPortChange();
    onMaxPortChange();
    setInputFieldValue(defaultValue);
    setValueFieldValue(defaultValue);

    updateActiveTrack(defaultValue); // needs to be passed as argument, is this async?
}

function onLabelTextChanged()
{
    const labelText = labelPort.get();
    label.textContent = labelText;
    if (CABLES.UI) op.setUiAttrib({ "extendTitle": labelText });
}

function onParentChanged()
{
    siblingsPort.set(null);
    parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(parent);
    }
    else if (el.parentElement) el.parentElement.removeChild(el);

    updateActiveTrack();
}

function setValueFieldValue(v)
{
    value.value = v;
}

function setInputFieldValue(v)
{
    input.value = v;
}

function showElement(el)
{
    if (el)el.style.display = "block";
}

function hideElement(el)
{
    if (el)el.style.display = "none";
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(el)
{
    if (el && el.parentNode && el.parentNode.removeChild) el.parentNode.removeChild(el);
}


};

Ops.Sidebar.Slider_v3.prototype = new CABLES.Op();
CABLES.OPS["74730122-5cba-4d0d-b610-df334ec6220a"]={f:Ops.Sidebar.Slider_v3,objName:"Ops.Sidebar.Slider_v3"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v2
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 0.5),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry", null, "geometry"),
    UP = vec3.fromValues(0, 1, 0),
    RIGHT = vec3.fromValues(1, 0, 0);

let
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    mesh;

inTrigger.onTriggered = function ()
{
    if (needsRebuild) buildMesh();
    if (inDraw.get()) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inStacks.onChange =
inSlices.onChange =
inStacklimit.onChange =
inRadius.onChange = function ()
{
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if (mesh)mesh.dispose(); };

function buildMesh()
{
    const
        stacks = Math.ceil(Math.max(inStacks.get(), 2)),
        slices = Math.ceil(Math.max(inSlices.get(), 3)),
        stackLimit = Math.min(Math.max(inStacklimit.get() * stacks, 1), stacks),
        radius = inRadius.get();
    let
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x, y, z, d, t, a,
        o, u, v, i, j;
    for (i = o = 0; i < stacks + 1; i++)
    {
        v = (i / stacks - 0.5) * Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        // for (j = 0; j < slices+1; j++) {
        for (j = slices; j >= 0; j--)
        {
            u = (j / slices) * TAU;
            x = Math.cos(u) * a;
            z = Math.sin(u) * a;

            positions.push(x * radius, y * radius, z * radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j / slices, i / (stacks + 1));

            d = Math.sqrt(x * x + y * y + z * z);
            normals.push(
                tmpNormal[0] = x / d,
                tmpNormal[1] = y / d,
                tmpNormal[2] = z / d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec, tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for (j = 0; j < slices; j++, o++)
        {
            indices.push(
                o, o + 1, o + slices + 1,
                o + 1, o + slices + 2, o + slices + 1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.setRef(geom);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    needsRebuild = false;
}


};

Ops.Gl.Meshes.Sphere_v2.prototype = new CABLES.Op();
CABLES.OPS["450b4d68-2278-4d9f-9849-0abdfa37ef69"]={f:Ops.Gl.Meshes.Sphere_v2,objName:"Ops.Gl.Meshes.Sphere_v2"};




// **************************************************************
// 
// Ops.Gl.RandomCluster
// 
// **************************************************************

Ops.Gl.RandomCluster = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    num = op.inValueInt("num"),
    seed = op.inValueFloat("random seed", 1.5),
    round = op.inValueBool("round", false),
    size = op.inValueFloat("size", 10),
    scaleX = op.inValueFloat("scaleX", 1),
    scaleY = op.inValueFloat("scaleY", 1),
    scaleZ = op.inValueFloat("scaleZ", 1),
    trigger = op.outTrigger("trigger"),
    idx = op.outNumber("index"),
    rnd = op.outNumber("rnd"),
    rotX = op.inValueSlider("Rotate X", 1),
    rotY = op.inValueSlider("Rotate Y", 1),
    rotZ = op.inValueSlider("Rotate Z", 1),
    scrollX = op.inValue("Scroll X", 0);

op.setPortGroup("Area", [size, scaleX, scaleY, scaleZ]);
op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Parameters", [num, round, seed]);
op.toWorkPortsNeedToBeLinked(exe, trigger);

const cgl = op.patch.cgl;
const randoms = [];
const origRandoms = [];
const randomsRot = [];
const randomsFloats = [];

const transVec = vec3.create();
const mat = mat4.create();

seed.onChange =
    num.onChange =
    size.onChange =
    scaleX.onChange =
    scaleZ.onChange =
    scaleY.onChange =
    round.onChange =
    rotX.onChange =
    rotY.onChange =
    rotZ.onChange = reset;

num.set(100);

function doRender()
{
    if (cgl.shouldDrawHelpers(op))
    {
        CABLES.GL_MARKER.drawCube(op,
            size.get() / 2 * scaleX.get(),
            size.get() / 2 * scaleY.get(),
            size.get() / 2 * scaleZ.get());
    }

    if (scrollX.get() != 0)
    {
        for (let i = 0; i < origRandoms.length; i++)
        {
            randoms[i][0] = origRandoms[i][0] + scrollX.get();
            randoms[i][0] = (randoms[i][0] % size.get()) - (size.get() / 2);
        }
    }

    for (let i = 0; i < randoms.length; i++)
    {
        cgl.pushModelMatrix();

        mat4.translate(cgl.mMatrix, cgl.mMatrix, randoms[i]);

        if (randomsRot[i][0]) mat4.rotateX(cgl.mMatrix, cgl.mMatrix, randomsRot[i][0]);
        if (randomsRot[i][1]) mat4.rotateY(cgl.mMatrix, cgl.mMatrix, randomsRot[i][1]);
        if (randomsRot[i][2]) mat4.rotateZ(cgl.mMatrix, cgl.mMatrix, randomsRot[i][2]);

        idx.set(i);
        rnd.set(randomsFloats[i]);

        trigger.trigger();
        // op.patch.instancing.increment();

        cgl.popModelMatrix();
    }
    // op.patch.instancing.popLoop();
}

exe.onTriggered = doRender;

function getRandomPos()
{
    return vec3.fromValues(
        scaleX.get() * (Math.seededRandom() - 0.5) * size.get(),
        scaleY.get() * (Math.seededRandom() - 0.5) * size.get(),
        scaleZ.get() * (Math.seededRandom() - 0.5) * size.get()
    );
}

function reset()
{
    randoms.length = 0;
    randomsRot.length = 0;
    randomsFloats.length = 0;
    origRandoms.length = 0;

    Math.randomSeed = seed.get();

    const makeRound = round.get();

    for (let i = 0; i < num.get(); i++)
    {
        randomsFloats.push(Math.seededRandom());

        let v = getRandomPos();

        if (makeRound && size.get() > 0)
            while (vec3.len(v) > size.get() / 2)
                v = getRandomPos();

        origRandoms.push([v[0], v[1], v[2]]);
        randoms.push(v);

        randomsRot.push(vec3.fromValues(
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotX.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotY.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotZ.get()
        ));
    }
}


};

Ops.Gl.RandomCluster.prototype = new CABLES.Op();
CABLES.OPS["ca3bc984-e596-48fb-b53d-502eb13979b0"]={f:Ops.Gl.RandomCluster,objName:"Ops.Gl.RandomCluster"};



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
