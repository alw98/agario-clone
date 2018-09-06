class Point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    
    add(vector){
        this.x += vector.x;
        this.y += vector.y;
    }
}

class Blob{
    
    constructor(point, m, vel){
        this.center = point;
        this.mass = m;
        this.newMass = m;
        this.color = color(random(150), random(150), random(150));
        this.canBeEaten = false;
        this.velocity = vel;
        this.timer = m;
    }
    
    draw(){
        if(!this.selected)
            noStroke();
        else {
            stroke(0);
            strokeWeight(10);
        }
        fill(this.color)
        ellipse(this.center.x, this.center.y, this.diameter(), this.diameter());
    }
    
    
    sploot(center){
        if(this.mass < 200 || blob.length > maxBlobs)
            return null;
        this.setMass(this.mass / 2);
        let sx = center.x - this.center.x;
        let sy = center.y - this.center.y;
        let newCenter = createVector(this.center.x, this.center.y);
        let vel = createVector(mouseX-width/2 + sx, mouseY-height/2 + sy);
        vel.setMag(this.diameter());
        newCenter.add(vel);
        let dir = createVector(mouseX-width/2 + sx, mouseY-height/2 + sy);
        //newCenter.setMag(this.diameter());
        dir.setMag(10);
        let ret = new Blob(newCenter, this.mass, dir);
        ret.color = this.color;
        return ret;
    }
    
    setMass(m){
        this.newMass = m;
        this.mass = m;
    }
    update(center){
        if(this.velocity)
            this.staticUpdate();
        let sx = center.x - this.center.x;
        let sy = center.y - this.center.y;
        let vel = createVector(mouseX-width/2 + sx, mouseY-height/2 + sy);
        let d = this.diameter();
        let x2 = (.000002595 * (d * d));
        let x = (-.003063 * d);
        let c = 1.03;
        let s = 3 * (x2 + x + c);
        vel.setMag(s);
        this.center.add(vel);
        if(this.newMass > this.mass){
            let toAdd = (this.newMass - this.mass) / 8;
            this.mass += toAdd;
        }
        if(this.timer <= 0)
            this.canBeEaten = true;
        else{
            this.timer -= 10 ;
            this.canBeEaten = false;
        }
    }
    
    staticUpdate(){
        this.center.add(this.velocity);
        this.velocity.mult(.9);
        if(this.velocity.mag() < .1)
            this.velocity = null;
    }
    
    intersects(b){
        let t1 = b.center.x - this.center.x;
        let t2 = b.center.y - this.center.y;
        let d = sqrt((t1*t1) + (t2*t2));
        let r = b.diameter()/2 + this.diameter()/2;
        return (d <= r);
    }
    
    diameter(){
        return 3 * sqrt(this.mass);
        
    }
    
    addMass(m){
        this.newMass += m;
    }
    
    eats(b){
       let t1 = b.center.x - this.center.x;
        let t2 = b.center.y - this.center.y;
        let d = sqrt((t1*t1) + (t2*t2));
        let r = this.diameter()/2;
        return (d <= r && this.mass >= b.mass * 1.5); 
    }
    
    converge(b){
        let t1 = b.center.x - this.center.x;
        let t2 = b.center.y - this.center.y;
        let d = sqrt((t1*t1) + (t2*t2));
        let r = this.diameter()/2;
        return (d <= r);
    }
    
    collide(b){
        let t1 = b.center.x - this.center.x;
        let t2 = b.center.y - this.center.y;
        let d = sqrt((t1*t1) + (t2*t2));
        let r = b.diameter()/2 + this.diameter()/2;
        if(d < r){
            let overlap = r - d;
            let v = p5.Vector.sub(this.center, b.center);
            v.setMag(overlap);
            this.center.add(v);
        }
        return (d <= r);
    }
}

class Rectangle{
    
    constructor(point, w, h){
        this.center = point;
        this.w = w;
        this.h = h;
    }
    
    intersect(rect){
        let thisc = this.center;
        let rectc = rect.center;
        return !(rectc.x + rect.w < thisc.x - this.w
                || rectc.x - rect.w > thisc.x + this.w 
                || rectc.y + rect.h < thisc.y - this.h
                || rectc.y - rect.h > thisc.y + this.h);
    }
    
    blobIntersect(blob){
        let thisc = this.center;
        let blobc = blob.center;
        return !(blobc.x + blob.diameter()/2 < thisc.x - this.w
                || blobc.x - blob.diameter()/2 > thisc.x + this.w 
                || blobc.y + blob.diameter()/2 < thisc.y - this.h
                || blobc.y - blob.diameter()/2 > thisc.y + this.h);
    } 
    
    inBounds(point){
        let thisc = this.center;
        return (point.x > thisc.x - this.w
            && point.x < thisc.x + this.w
            && point.y > thisc.y - this.h
            && point.y < thisc.y + this.h);
    }
}

class BlobTree{
    constructor(bound, n){
        this.cap = n;
        this.bound = bound;
        this.divided = false;
        this.blobs = [];
    }
    
    insertToSubs(blob){
        this.nw.insert(blob);
        this.ne.insert(blob);
        this.sw.insert(blob);
        this.se.insert(blob);
    }
    
    
    getBlobsInArea(bound, result){
        let i = 0;
        if(!this.bound.intersect(bound))
            return i;
        for(let b of this.blobs){
            if(bound.blobIntersect(b)){
                result.push(b);
            }
            i++;
        }

        if(this.divided){
            i += this.nw.getBlobsInArea(bound, result);
            i += this.ne.getBlobsInArea(bound, result);
            i += this.sw.getBlobsInArea(bound, result);
            i += this.se.getBlobsInArea(bound, result);   
        }
        return i;
    }
    
    subdivide(){
        if(this.divided)
            return;
        let center = this.bound.center;
        let w = this.bound.w / 2;
        let h = this.bound.h / 2;
        let nw = new Rectangle(new Point(center.x - w, center.y - h), w, h);
        let ne = new Rectangle(new Point(center.x + w, center.y - h), w, h);
        let sw = new Rectangle(new Point(center.x - w, center.y + h), w, h);
        let se = new Rectangle(new Point(center.x + w, center.y + h), w, h);
        this.nw = new BlobTree(nw, this.cap);
        this.ne = new BlobTree(ne, this.cap);
        this.sw = new BlobTree(sw, this.cap);
        this.se = new BlobTree(se, this.cap);
        for(let i = this.blobs.length - 1; i >= 0; i--){
            let b = this.blobs[i];
            let amt = this.inSubs(b);
            if(amt == 1){
                let index = this.blobs.indexOf(b);
                this.blobs.splice(index, 1);
                this.insertToSubs(b);
            }
        }
        this.divided = true;
    }
    
    inSubs(blob){
        let amt = 0;
        if(this.nw.bound.blobIntersect(blob)) amt++;
        if(this.ne.bound.blobIntersect(blob)) amt++;
        if(this.sw.bound.blobIntersect(blob)) amt++;
        if(this.se.bound.blobIntersect(blob)) amt++;
        return amt;
    }
    
    insert(blob){
        if(!this.bound.blobIntersect(blob))
            return;
        if(this.blobs.length < this.cap && !this.divided)
            this.blobs.push(blob);
        else {
            if(!this.divided)
                this.subdivide();
            if(this.inSubs(blob) > 1)
                this.blobs.push(blob);
            else this.insertToSubs(blob);
        }
    }
    
    draw(){
        stroke(255);
        strokeWeight(1);
        noFill();
        rectMode(CENTER);
        rect(this.bound.center.x, this.bound.center.y, this.bound.w*2, this.bound.h*2);
        if(this.divided){
            this.nw.draw();
            this.ne.draw();
            this.sw.draw();
            this.se.draw();
        }
            
    }
    
    clear(){
        this.divided = false;
        this.blobs = [];
    }
    
    remove(b){
        if(!this.bound.blobIntersect(b)){
            return this.blobs.length;
        }
        let index = this.blobs.indexOf(b);
        if(index != -1){
            this.blobs.splice(index, 1);
            return this.blobs.length;
        }
        if(this.divided){
            let amt = this.blobs.length;
            amt += this.nw.remove(b); 
            amt += this.ne.remove(b);
            amt += this.sw.remove(b);
            amt += this.se.remove(b);
            amt += this.blobs.length;
            if(!(this.nw.divided || this.ne.divided 
                 || this.sw.divided || this.se.divided) && amt <= this.cap){
                this.congeal();
            }
        }
        return this.blobs.length;
    }
    
    congeal(){
        Array.prototype.push.apply(this.blobs, this.nw.blobs);
        Array.prototype.push.apply(this.blobs, this.ne.blobs);
        Array.prototype.push.apply(this.blobs, this.sw.blobs);
        Array.prototype.push.apply(this.blobs, this.se.blobs);
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }
}

class QuadTree{
    constructor(bound, n){
        this.cap = n;
        this.bound = bound;
        this.divided = false;
        this.points = [];
    }
    
    insertToSub(point){
        this.nw.insert(point);
        this.ne.insert(point);
        this.sw.insert(point);
        this.se.insert(point);
    }
    
    subdivide(){
        if(this.divided)
            return;
        let center = this.bound.center;
        let w = this.bound.w / 2;
        let h = this.bound.h / 2;
        let nw = new Rectangle(new Point(center.x - w, center.y - h), w, h);
        let ne = new Rectangle(new Point(center.x + w, center.y - h), w, h);
        let sw = new Rectangle(new Point(center.x - w, center.y + h), w, h);
        let se = new Rectangle(new Point(center.x + w, center.y + h), w, h);
        this.nw = new QuadTree(nw, this.cap);
        this.ne = new QuadTree(ne, this.cap);
        this.sw = new QuadTree(sw, this.cap);
        this.se = new QuadTree(se, this.cap);
        for(let p of this.points){
            this.insertToSub(p);
        }
        this.points = [];
        this.divided = true;
    }
    
    insert(point){
        if(!this.bound.inBounds(point))
            return;
        if(this.points.length < this.cap && !this.divided)
            this.points.push(point);
        else {
            this.subdivide();
            this.insertToSub(point);
        }
    }
    
    draw(){
        stroke(255);
        strokeWeight(1);
        noFill();
        rectMode(CENTER);
        rect(this.bound.center.x, this.bound.center.y, this.bound.w*2, this.bound.h*2);
        if(this.divided){
            this.nw.draw();
            this.ne.draw();
            this.sw.draw();
            this.se.draw();
        }
            
    }
    
}

class Stopwatch{
    constructor(){
        this.started = false;
    }
    
    start(){
        this.started = true;
        this.time = millis();
    }
    
    stop(){
        this.started = false;
        return millis() - this.time;
    }
}

