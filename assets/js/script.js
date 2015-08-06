$(function(){

	var body = $('body'),
		stage = $('#stage'),
		back = $('a.back');

	/* Step 1 */

	$('#step1 .encrypt').click(function(){
		body.attr('class', 'encrypt');

		// Go to step 2
		step(2);
	});

	$('#step1 .decrypt').click(function(){
		body.attr('class', 'decrypt');
		step(2);
	});


	/* Step 2 */


	$('#step2 .button').click(function(){
		// Trigger the file browser dialog
		$(this).parent().find('input').click();
	});


	// Set up events for the file inputs

	var file = null;

	$('#step2').on('change', '#encrypt-input', function(e){

		// Has a file been selected?

		if(e.target.files.length!=1){
			alert('Please select a file to encrypt!');
			return false;
		}

		file = e.target.files[0];

		if(file.size > 1024*1024){
			alert('Please choose files smaller than 1mb, otherwise you may crash your browser. \nThis is a known issue. See the tutorial.');
			return;
		}

		step(3);
	});

	$('#step2').on('change', '#decrypt-input', function(e){

		if(e.target.files.length!=1){
			alert('Please select a file to decrypt!');
			return false;
		}

		file = e.target.files[0];
		step(3);
	});


	/* Step 3 */

	var  saveData; 
	$('a.button.process').click(function(){

		var input = $(this).parent().find('input[type=password]'),
			a = $('#step4 a.download'),
			password = input.val();

		input.val('');

		if(password.length<5){
			alert('Please choose a longer password!');
			return;
		}
		
		// The HTML5 FileReader object will allow us to read the 
		// contents of the	selected file.

		var reader = new FileReader();

		if(body.hasClass('encrypt')){

			//set default file name
			$('#savefile').attr('nwsaveas', file.name + '.encrypted' );
			// Encrypt the file!
			
			reader.onload = function(e){

				// Use the CryptoJS library and the AES cypher to encrypt the 
				// contents of the file, held in e.target.result, with the password
				
				window.crypto.subtle.digest(
					{
						name: "SHA-256",
					},
					str2ab( password )//The data you want to hash as an ArrayBuffer
					)
					.then(function(hash){
						//returns the hash as an ArrayBuffer
						//console.log(hash);
					
					 var key = (hash.slice(0, 16));
					 var iv_buf = (hash.slice(16));
					 
						 window.crypto.subtle.importKey(
							"raw", //can be "jwk" or "raw"
							key,
							{   //this is the algorithm options
								name: "AES-CBC",
								length: 256,
							},
							false, //whether the key is extractable (i.e. can be used in exportKey)
							["encrypt"] //can be any combination of "encrypt" and "decrypt"
						)
						.then(function(key_buf){
							//returns the symmetric key
							//var res = (e.target.result).replace('data:text/plain;base64,','');
							window.crypto.subtle.encrypt(
							{
									name: "AES-CBC",
									length: 256,
									//Don't re-use initialization vectors!
									//Always generate a new iv every time your encrypt!
									iv: iv_buf,
							},
								key_buf, //from generateKey or importKey above
								str2ab(e.target.result)//ArrayBuffer of data you want to encrypt
							)
							.then(function(encrypted){
								//to save Data
								 saveData =  ab2str(encrypted);
					
							})
							.catch(function(err){
								alert( "Add issue on github: " + err );
							});
						})
						.catch(function(err){
							alert( "Add issue on github: " + err );
						});
					})
					.catch(function(err){
						alert( "Add issue on github: "+err);
					});
						
				step(4);
			};

			// This will encode the contents of the file into a data-uri.
			// It will trigger the onload handler above, with the result
			reader.readAsDataURL(file);
		}
		else {
			$('#savefile').attr('nwsaveas', file.name.replace('.encrypted','') );
					
			// Decrypt it!
			reader.onload = function(e){
				//var decrypted 
					window.crypto.subtle.digest(
					{
						name: "SHA-256",
					},
					str2ab(password)//The data you want to hash as an ArrayBuffer
					)
					.then(function(hash){
						//returns the hash as an ArrayBuffer
						//console.log(hash);
				
					 var key = (hash.slice(0, 16));
					 var iv_buf = (hash.slice(16));
					 
						 window.crypto.subtle.importKey(
							"raw", //can be "jwk" or "raw"
							key,
							{   //this is the algorithm options
								name: "AES-CBC",
								length: 256,
							},
							false, //whether the key is extractable (i.e. can be used in exportKey)
							["decrypt"] //can be any combination of "encrypt" and "decrypt"
						)
						.then(function(key_buf){
							
							window.crypto.subtle.decrypt(
								{
									name: "AES-CBC",
									length: 256,
									iv: iv_buf,
								},
								key_buf, //from generateKey or importKey above
								str2ab(e.target.result) //ArrayBuffer of the data
							)
							.then(function(decrypted){
								// the decrypted data
								saveData = ab2str( decrypted );			
							})
							.catch(function(err){
								alert( "Add issue on github: "+err);
							});
							
						})
						.catch(function(err){
							alert( "Add issue on github: "+err);
						});
					})
					.catch(function(err){
						alert( "Add issue on github: "+err);
					});
		
				step(4);
			};

			reader.readAsText(file);
		}
	});


	$('a.button.download').click(function(){
			
		$('#savefile').click();		
			
	})
	
	function decodeBase64(dataString) {
	  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
		//response = {};

		//matches is null
		if (matches == null){
		
			return dataString;
		}
		
		//matches is unknown string 
		if (matches.length !== 3){
			
			return dataString;
		}
	  //if (matches.length !== 3) {
	//	return new Error('Invalid input string');
	 // }

	 // response.type = matches[1];
	 // response.data = new Buffer(matches[2], 'base64');

	  return new Buffer(matches[2], 'base64');
	}
	
	$('#savefile').on('change', function (event) {
		
		 var fs = require('fs');
		
		
		fs.writeFileSync( $(this).val(), decodeBase64(saveData) );

				alert('Saved to: ' + $(this).val() );

				 this.files.clear();
				
	});	
	
	/* The back button */


	back.click(function(){

		// Reinitialize the hidden file inputs,
		// so that they don't hold the selection 
		// from last time

		$('#step2 input[type=file]').replaceWith(function(){
			return $(this).clone();
		});

		step(1);
	});


	// Helper function that moves the viewport to the correct step div

	function step(i){

		if(i == 1){
			back.fadeOut();
		}
		else{
			back.fadeIn();
		}

		// Move the #stage div. Changing the top property will trigger
		// a css transition on the element. i-1 because we want the
		// steps to start from 1:

		stage.css('top',(-(i-1)*100)+'%');
	}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

});
