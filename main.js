let ws,map,osm,urthere;

let debugMode=false;

let alreadyStarted=false;

let prevScreen=0;
let currentScreen=0;

let tool=0;
let toolsInfo=[
	"You weren't supposed to see this.",
	"<h2><span onclick='closeDescription();'><&nbsp&nbsp</span>Emergency alert</h2>Alerts you when the 'Harlequin' is near you.",
	"<h2><span onclick='closeDescription();'><&nbsp&nbsp</span>Vision expansion</h2>Makes you collect eggs more easily.",
	"<h2><span onclick='closeDescription();'><&nbsp&nbsp</span>Egg-o-meter</h2>Gives you the distance to the nearest egg.",
	"<h2><span onclick='closeDescription();'><&nbsp&nbsp</span>Emergency locator</h2>Gives you the accurate location of the 'Harlequin'."
];

let osmpath="https://tile.openstreetmap.org/{z}/{x}/{y}.png";
let satpath="https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?sku=101Xb2qC6qvmw&access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA";

function init(){
	ws=new WebSocket("wss://localhost:443");
	ws.onopen=function(){
		document.getElementById("signInBtn01").style.display="block";
		if(debugMode){fakeSignIn();}
		setScreen(1);
	}
	ws.onmessage=function(e){
		let msg=e.data.split("(!)");
		if(msg[0]=="start"){
			if(!alreadyStarted){
				alreadyStarted=true;
				setScreen(2);
				map=L.map("map",{zoomControl:false,maxZoom:19,minZoom:15}).setView([0,0],17);
				osm=L.tileLayer(osmpath,{minZoom:15,maxZoom:19,attribution:"<a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"});
				osm.addTo(map);
				urthere=L.marker([0,0]);
				urthere.addTo(map);
				map.on('click',mapclickfunction);
				setInterval(function(){
					if(currentScreen==4){
						try{
							ws.send("leaderboard");
						}catch(err){}
					}
					ws.send("eggscoins");
				},500);
			}
		}
		if(msg[0]=="self"){
			document.getElementById("screen3").innerHTML=msg[1];
		}
		if(msg[0]=="welcome"){
			document.getElementById("welcome").style.display="block";
		}
		if(msg[0]=="eggfound"){
			try{
				navigator.vibrate(200);
			}catch(err){}
			document.getElementById("wow").style.display="block";
		}
		if(msg[0]=="gulp"){
			try{
				navigator.vibrate(1000);
			}catch(err){}
			document.getElementById("lose").style.display="block";
		}
		if(msg[0]=="leaderboard"){
			let ldata=JSON.parse(msg[1]);
			let lelem=document.getElementById("leaderboard");
			lelem.innerHTML="";
			for(let i=0;i<ldata.length;i++){
				let lelems=document.createElement("p");
				lelems.style.width="50%";
				lelems.style.border="4px solid #000000";
				lelems.style.borderRadius="20px";
				lelems.innerHTML="<h2>"+ldata[i].username+"</h2><p style='display:inline-block;font-size:50px;'>"+String(ldata[i].eggs)+"</p><img src='assets/egg.png'/>";
				lelem.appendChild(lelems);
			}
		}
		if(msg[0]=="eggscoins"){
			let eggscoins=JSON.parse(msg[1]);
			document.getElementById("eggsind").innerText=String(eggscoins[0]);
			document.getElementById("coinsind").innerText=String(eggscoins[1]);
		}
		if(msg[0]=="invalidtool"){
			document.getElementById("desc").innerHTML=toolsInfo[tool]+"<br><img src='assets/lock.png'/>You need "+msg[1]+" coins to buy this.<br><button onclick='ws.send(\"buy(!)"+String(tool)+"\");'>Buy</button>";
			document.getElementById("desc").style.display="block";
			console.log("fail");
		}
		if(msg[0]=="purchaseok"){
			setTool(tool);
		}
		if(msg[0]=="rawalert"){
			alert(msg[1]);
		}
		if(msg[0]=="rawjs"){
			eval(msg[1]);
		}
		if(msg[0]=="meter"){
			document.getElementById("meter").style.display="block";
			document.getElementById("meter_point").style.left=msg[1]+"%";
		}
	}
	ws.onclose=function(e){
		setScreen(0);
	}
	ws.onerror=function(e){
		setScreen(0);
	}
}

function onSignIn(googleUser){
	let profile=googleUser.getBasicProfile();
	let name=String(profile.getName());
	let tok=String(googleUser.getAuthResponse().id_token);
	launchGeolocation();
	document.getElementById("signInBtn11").style.display="none";
	document.getElementById("signInBtn12").style.display="block";
	ws.send("login(!)"+tok);
}

function fakeSignIn(){
	let name="early user";
	let tok="";
	launchGeolocation();
	document.getElementById("signInBtn11").style.display="none";
	document.getElementById("signInBtn12").style.display="block";
	ws.send("login(!)"+tok);
}

function launchGeolocation(){
	try{
	function success(position){
		gotLocation(position.coords.latitude,position.coords.longitude);
	}
	function error(err){
		console.log(err);
	}
	if(!debugMode){
		navigator.geolocation.watchPosition(success,error,{enableHighAccuracy:true,maximumAge:10000});
	}else{
		gotLocation(39.9257,21.8120);
	}
	}catch(err){console.log(err);}
}

function gotLocation(a,o){
	panToLocation(a,o);
	ws.send("geo(!)"+String(a)+"(!)"+String(o));
}

function panToLocation(lat,lon){
	try{
		map.panTo(L.latLng(lat,lon));
		urthere.setLatLng(L.latLng(lat,lon));
	}catch(err){}
}

function backScreen(){
	setScreen(prevScreen);
}

function setScreen(screenid){
	let i=0;
	while(true){
		try{
			document.getElementById("screen"+String(i)).style.display="none";
			i++;
		}catch(err){
			break;
		}
	}
	prevScreen=currentScreen;
	currentScreen=screenid;
	document.getElementById("screen"+String(screenid)).style.display="block";
}

function mapclickfunction(e){
	let coords=[e.latlng['lat'],e.latlng['lng']];
	gotLocation(coords[0],coords[1]);
}

function setTool(toolNum){
	if(tool!=0){
		if(tool==3){
			document.getElementById("meter").style.display="none";
		}
		document.getElementById("tool"+String(tool)).style.background="none";
	}
	document.getElementById("tool"+String(toolNum)).style.background="#DF4A16";
	tool=toolNum;
	document.getElementById("desc").innerHTML=toolsInfo[toolNum];
	document.getElementById("desc").style.display="block";
	ws.send("tool(!)"+String(tool));
}

function askRename(){
	ws.send("rename(!)"+window.prompt("Set the name to appear on the leaderboard (Don't use your real name) (You can't change it):"));
}

function closeDescription(){
	document.getElementById("desc").style.display="none";
}

document.addEventListener("DOMContentLoaded",init);

