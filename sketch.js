let qt;
let blob = [];
let w = 20000;
let h = 20000;
let amt = 100000;
let blobs = [amt];
let zoom = 1;
let stopwatch;
let maxBlobs = 16;
let willSplit = false;
let willShoot = false;

function setup() {
  // put setup code here
    createCanvas(1000, 1000 );
    let rect = new Rectangle(createVector(0, 0), w/2, h/2);
    qt = new BlobTree(rect, 4);
    stopwatch = new Stopwatch();       
    let p = createVector(200, 200);
    blob.push(new Blob(p, 150, null));
    //p = createVector(400, 400);
    //blob.push(new Blob(p, 2000, null));
    //blobs.push(blob);
    print("Populating qt");
    let st = new Stopwatch();
    st.start();
    let time = 0;
    for(let i = 0; i < amt; i++){
        stopwatch.start();
        newBlob();
        time += stopwatch.stop();
        if (i % 100000 == 0)
            print("Number %d time %dms", i, time);
    }
    print("Time to add %d elements to qt: %dms total time: %dms", amt, time, st.stop());
}

function smallest(){
    let ret = blob[0];
    for(let b of blob){
        if(b.mass < ret.mass)
            ret = b;
    }
    return ret;
}

function largest(){
    let ret = blob[0];
    for(let b of blob){
        if(b.mass > ret.mass)
            ret = b;
    }
    return ret;
}

let timer = 0;
let lastZoom = 1;
function draw(){
    background(255);
    push();
    
    stopwatch.start();
    let smallest = this.smallest();
    let largest = this.largest();
    let blobSpace = this.blobSpace();
    if(blobSpace.w < width/4)
        zoom = 1;
    else
        zoom = width / 4 / max(blobSpace.w, blobSpace.h );
    zoom = (lastZoom + zoom) / 2;
    lastZoom = zoom;
    translate((width/2 - blobSpace.center.x * zoom), (height/2 - blobSpace.center.y * zoom) );
    scale(zoom);
    let setupTime = stopwatch.stop();
    
    stopwatch.start();
    for(let b of blob)
        b.update(blobSpace.center);
    let blobUpdateTime = stopwatch.stop();
    
    stopwatch.start();
    if(this.willSplit){
        let len = blob.length;
        for(let i = 0; i < len; i++){
            let b = blob[i];
            let tmp = b.sploot(blobSpace.center);
            if(tmp)
                blob.push(tmp);
        }
        this.willSplit = false;
    }
    let splitTime = stopwatch.stop();
    
    stopwatch.start();
    for(let i = blob.length - 1; i >= 0; i--){
        for(let j = blob.length - 1; j >= 0; j--){
            if(i != j){
                let b = blob[i];
                let bl = blob[j];
                if(b && bl){
                    if(bl.canBeEaten){
                        if(b.converge(bl)){
                            b.addMass(bl.mass);
                            blob.splice(j, 1);
                        }
                    } else {
                        b.collide(bl);
                    }
                }
            }
        }
    } 
    let playerLogicTime = stopwatch.stop();
    
    stopwatch.start();
    let arr = [];
    let bound = new Rectangle(blobSpace.center, width / zoom, height / zoom);
    qt.getBlobsInArea(bound, arr);
    let firstSearchTime = stopwatch.stop();
    
    stopwatch.start();
    for(let b of arr){
        //qt.insert(b);
        if(b.velocity)
            b.staticUpdate();
        b.draw();
    }
    let drawTime = stopwatch.stop();
    
    let secondSearchTime =  0;
    let collisionTime = 0;
    for(let b of blob){
        stopwatch.start();
        arr = [];
        bound = new Rectangle(b.center, b.diameter() / 2, b.diameter() / 2);
        qt.getBlobsInArea(bound, arr);
        secondSearchTime += stopwatch.stop();
        stopwatch.start();
        for(let bl of arr){
            if(b != bl && b.eats(bl)){
                b.addMass(bl.mass);
                qt.remove(bl);
                newBlob();
            }
        }
        collisionTime += stopwatch.stop();
    }
    
     //print("Setup: %d BlobTime: %d SplitTime: %d PlayerLogicTime: %d S1: %d S2: %d Draw: %d Collision: %d", setupTime, blobUpdateTime, splitTime, playerLogicTime, firstSearchTime, secondSearchTime, drawTime, collisionTime);
    for(let b of blob)
        b.draw();
    //qt.draw();
    
    pop();
}

function newBlob(){
    let p = new Point(random(-w/2, w/2), random(-h/2, h/2));
    let b = new Blob(p, random(16, 100), null);
    qt.insert(b);
}


function blobSpace(){
    let x1 = null;
    let x2 = null;  
    let y1 = null; 
    let y2 = null;
    for(let b of blob){
        let r = b.diameter() / 2;
        let nx1 = b.center.x - r;
        let nx2 = b.center.x + r;
        let ny1 = b.center.y - r;
        let ny2 = b.center.y + r;
        if(!x1 || nx1 < x1)
            x1 = nx1;
        if(!x2 || nx2 > x2)
            x2 = nx2;
        if(!y1 || ny1 < y1)
            y1 = ny1;
        if(!y2 || ny2 > y2)
            y2 = ny2;
        
    }
    let xc = (x1 + x2) / 2;
    let yc = (y1 + y2) / 2;
    let w = (x2 - x1);
    let h = (y2 - y1);
    return new Rectangle(createVector(xc, yc), w, h);
}

function keyPressed(){
    if(key == ' ')
        sploot ();
    else if(key == 'w')
        shootBlob();
    return false;
}

function sploot(){
    this.willSplit = true;
}

function shootBlob(){
    this.willShoot = true;
}