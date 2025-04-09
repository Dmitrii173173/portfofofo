var posts = [
    // { imgPath: "images/projects/experiment1.jpg",  link: "http://domenicobrz.github.io/webgl/projects/experiment1/", description: "", tags: ["webgl", "threejs"] },
    { imgPath: "images/projects/blurryspider.jpg",  link: "https://domenicobrz.github.io/webgl/projects/blurry-web-spider/", description: "", tags: ["webgl", "threejs"] },
    { imgPath: "images/projects/doflines.jpg",  link: "http://domenicobrz.github.io/webgl/projects/DOF lines/", description: "", tags: ["webgl", "threejs"] },
    { imgPath: "images/projects/ssgi.jpg",  link: "http://domenicobrz.github.io/webgl/projects/SSGI/", description: "", tags: ["threejs", "webgl"] },

    { imgPath: "images/projects/thematrix.jpg",  link: "http://domenicobrz.github.io/webgl/projects/enter the matrix/", description: "", tags: ["webgl"] },
    { imgPath: "images/projects/doflinesrenderer2.jpg",  link: "http://domenicobrz.github.io/webgl/projects/DOFlines-2/", description: "", tags: ["webgl", "threejs"] },
    { imgPath: "images/projects/gpu-fluid-sim.jpg",  link: "http://domenicobrz.github.io/webgl/projects/gpu-fluid-sim/", description: "", tags: ["webgl", "threejs"] },


    { imgPath: "images/projects/ssr.png",  link: "http://domenicobrz.github.io/webgl/projects/SSR/", description: "", tags: ["webgl"] },
    { imgPath: "images/projects/glassabsorption.jpg",  link: "http://domenicobrz.github.io/webgl/projects/glass-absorption/", description: "", tags: ["threejs"] },

   { imgPath: "images/projects/lineint.jpg", link: "https://github.com/Domenicobrz/Line-Integral-Convolution", description: "", tags: ["webgl", "misc"] },

];


var selectedPosts = posts;


function onTagChange(activeTag) {
    selectedPosts = [];

    if (activeTag == "all") {
        // safe to do since selectedPosts is currently read-only
        selectedPosts = posts;
        return;
    }

    for (var i = 0; i < posts.length; i++)
        if(posts[i].tags.includes(activeTag))
            selectedPosts.push(posts[i]);
}


export { onTagChange, selectedPosts };