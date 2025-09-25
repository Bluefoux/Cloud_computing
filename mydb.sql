
CREATE TABLE IF NOT EXISTS COMPETITION (
    ID int NOT NULL AUTO_INCREMENT,
    CompName VARCHAR(255), 
    StartDate DATE, 
    EndDate DATE,
    CompetitionVenue VARCHAR(100),
    Organizer VARCHAR(100),
    NumberOfLanes INT,
    Length INT,
    IndividualStartFee INT,
    RelayStartFee INT,
    Description VARCHAR(400),
    primary key(ID)
);

CREATE TABLE IF NOT EXISTS MYSTATUS (
    ID int NOT NULL AUTO_INCREMENT,
    StatusText varchar(50),
    primary key (ID)
);

CREATE TABLE IF NOT EXISTS tblRankToLine (
    ID INT AUTO_INCREMENT,
    Size INT,
    MyRank INT,
    Line INT,
    primary key (ID)
);

CREATE TABLE IF NOT EXISTS REGISTRATIONS (
    ID int NOT NULL AUTO_INCREMENT,
    CompetitionID int,
    EventNumber int, 
    RegName VARCHAR(50), 
    LastName VARCHAR(50), 
    Team VARCHAR(50), 
    Age int,
    RegistrationTime time,
    primary key (ID)
);

CREATE TABLE IF NOT EXISTS MYEVENT (
    ID int NOT NULL auto_increment,
    CompetitionID int,
    EventNumber int, 
    EventName VARCHAR(100), 
    Distance int,
    Gender VARCHAR(45),
    MaxAge INT,
    QualifyingTime time,
    Relay bit(3),
    primary key (ID),
    foreign key (CompetitionID) references COMPETITION(ID)
);

CREATE TABLE IF NOT EXISTS ATHLEATS (
    ID int NOT NULL auto_increment,
    StatusID int,
    EventID int,
    AthleatName VARCHAR(50),
    LastName VARCHAR(50), 
    TeamName VARCHAR(50), 
    Gender VARCHAR(50),
    Age int,
    Heat int,
    Lane int,
    RegistrationTime time,
    ResultTime time,
    primary key (ID),
    foreign key (StatusID) references MYSTATUS(ID),
    foreign key (EventID) references MYEVENT(ID)
);


-- Procedures and Triggers
-- StoreProcedure import registrations to Athleats
DROP PROCEDURE IF EXISTS SP_ImportRegistration;
CREATE PROCEDURE SP_ImportRegistration()
BEGIN
DECLARE done INT DEFAULT FALSE;
DECLARE compid, eventnum, aage, eventidto INT;
DECLARE aName, aLastName, aTeam VARCHAR(50);
DECLARE aRegistrationTime TIME;
DECLARE CurRegistration CURSOR FOR SELECT CompetitionID,EventNumber,Age,RegName,LastName,Team,RegistrationTime FROM Registrations;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN CurRegistration;
myloop: LOOP
	FETCH CurRegistration INTO compid, eventnum, aage, aName, aLastName, aTeam, aRegistrationTime;
    IF done THEN
		LEAVE myloop;
	END IF;
    
    SET eventidto = (select MYEVENT.ID FROM MYEVENT WHERE MYEVENT.CompetitionID = compid AND MYEVENT.EventNumber = eventnum LIMIT 1);
    INSERT INTO ATHLEATS (EventID, AthleatName, LastName, TeamName, Age, RegistrationTime)
    VALUES (eventidto, aName, aLastName, aTeam, aage, aRegistrationTime);
-- SELECT compid, eventnum, aage, aName, aLastName, aTeam, aRegistrationTime;
END LOOP;
CLOSE CurRegistration;
End;

-- Store procedure get invoice (kinda work)
DROP PROCEDURE IF EXISTS SP_GetInvoice;
CREATE PROCEDURE SP_GetInvoice(compid INT)
BEGIN
DECLARE sum_invoice INT DEFAULT 0;
DECLARE invoiceperathleat INT DEFAULT 0;
SET invoiceperathleat = (SELECT IndividualStartFee FROM COMPETITION WHERE ID = compid);
SELECT ATHLEATS.TeamName, invoiceperathleat*COUNT(ATHLEATS.ID) AS InvoicePerEvent
	FROM ATHLEATS
	INNER JOIN MYEVENT
	ON ATHLEATS.EventID = MYEVENT.ID
	WHERE MYEVENT.CompetitionID = compid
	GROUP BY MYEVENT.CompetitionID, ATHLEATS.TeamName
	ORDER BY MYEVENT.CompetitionID, ATHLEATS.TeamName;
End;

-- Generate Start List
DROP PROCEDURE IF EXISTS Generate_StartList;
CREATE PROCEDURE Generate_StartList(compid INT, eventid INT)
BEGIN
SELECT AthleatName, Lastname, TeamName, RegistrationTime
	FROM ATHLEATS
    INNER JOIN MYEVENT
	ON ATHLEATS.EventID = MYEVENT.ID AND MYEVENT.CompetitionID = compid AND ATHLEATS.EventID = eventid
	ORDER BY RegistrationTime ASC;
End;

-- Get the contestents lane (based on ranking)
DROP FUNCTION IF EXISTS FN_RankToLine;
CREATE FUNCTION FN_RankToLine(Size INT, MyRank INT) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE LineVal INT;
    SELECT Line INTO LineVal
    FROM tblRankToLine
    WHERE tblRankToLine.Size = Size AND tblRankToLine.MyRank= MyRank;
    RETURN LineVal;
END;

DROP PROCEDURE IF EXISTS Generate_Heatlist;
CREATE PROCEDURE Generate_Heatlist(compid INT, evid INT)
BEGIN
DECLARE num_of_athleats INT DEFAULT 0;
DECLARE num_of_lanes INT DEFAULT 0;
DECLARE num_of_heats INT DEFAULT 0;
DECLARE athleatID INT DEFAULT 0;
DECLARE current_heat INT DEFAULT 0;
DECLARE current_rank INT DEFAULT 0;
DECLARE current_lane INT DEFAULT 0;
DECLARE done INT DEFAULT FALSE;
DECLARE Cursorathleats CURSOR FOR SELECT ID FROM ATHLEATS WHERE EventID = evid ORDER BY RegistrationTime ASC;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

SET num_of_athleats = (SELECT COUNT(ATHLEATS.ID) 
FROM MYEVENT 
INNER JOIN ATHLEATS
ON MYEVENT.ID = ATHLEATS.EventID AND MYEVENT.CompetitionID = compid AND MYEVENT.ID = evid);
SET num_of_lanes = (SELECT NumberOfLanes FROM COMPETITION WHERE ID = compid);
SET num_of_heats = (SELECT CEILING(num_of_athleats / num_of_lanes));

-- SELECT num_of_athleats, num_of_lanes, num_of_heats;

OPEN Cursorathleats;
heatloop: LOOP    
    SET current_heat = (num_of_heats - (current_rank DIV num_of_lanes));
    SET current_lane = 1 + MOD(current_rank, num_of_lanes);
    SET current_lane = FN_RankToLine(num_of_lanes, current_lane);
	FETCH Cursorathleats INTO athleatID;
    IF done THEN
		LEAVE heatloop;
	END IF;
    
    UPDATE ATHLEATS
    SET Heat = current_heat, Lane = current_lane 
    WHERE ID = athleatID;
    SET current_rank = current_rank+1;
END LOOP;
CLOSE Cursorathleats;
End;

-- delete event trigger (delete all athleats with eventid)
CREATE TRIGGER IF NOT EXISTS del_event BEFORE DELETE ON MYEVENT
FOR EACH ROW
BEGIN
	DELETE FROM ATHLEATS
    WHERE ATHLEATS.EventID = OLD.ID;
END;

-- delete competition trigger (delete all events with competitionid)
CREATE TRIGGER  IF NOT EXISTS del_comp BEFORE DELETE ON COMPETITION
FOR EACH ROW
BEGIN
	DELETE FROM MYEVENT
    WHERE MYEVENT.CompetitionID = OLD.ID;
END;