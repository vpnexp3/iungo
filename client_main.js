/**
 * @author Landmaster
 */

let joinCode = document.getElementById("join_code");
joinCode.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		//console.log(joinCode.value);
	}
});
